/**
 * Prism Sprite Icon Component
 * Custom Web Component <prism-sprite-icon> and JavaScript class SpriteIcon.
 * Uses high-performance CSS masking (mask-image + -webkit-mask-image) and
 * requestAnimationFrame easing to animate a hand-drawn sprite sheet at 60fps.
 */

import {
  cubicEaseInOut,
  calculateFrameIndex,
  calculateMaskPosition
} from './motion-math.js';

export class SpriteIcon {
  constructor(element, options = {}) {
    this.el = element;
    this.options = {
      spriteSheetUrl: options.spriteSheetUrl || '/assets/sprites/prism-sprite.webp',
      frameCount: Number(options.frameCount) || 24,
      columns: Number(options.columns) || 6,
      rows: Number(options.rows) || 4,
      duration: Number(options.duration) || 1100, // ms
      loopOnHover: Boolean(options.loopOnHover),
      iconColor: options.iconColor || 'currentColor',
      iconSize: options.iconSize || '120px',
      trigger: options.trigger || 'both', // 'hover' | 'tap' | 'both' | 'none'
      ariaLabel: options.ariaLabel || 'Prism icon mark',
      holdWeights: options.holdWeights || [
        2.5, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1.8, 1.8,
        1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1.5, 2.0
      ], // handcrafted "on twos" pacing with settled resting frames
      ...options
    };

    this.currentFrame = 0;
    this.isPlaying = false;
    this.isHovered = false;
    this.isPendingStop = false;
    this.startTime = null;
    this.rafId = null;

    // Media query for reduced motion
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.initDOM();
    this.bindEvents();
    this.preloadSprite();
  }

  initDOM() {
    this.el.classList.add('prism-sprite-wrapper');
    this.el.setAttribute('role', 'img');
    this.el.setAttribute('aria-label', this.options.ariaLabel);

    if (this.options.trigger !== 'none') {
      if (!this.el.hasAttribute('tabindex')) {
        this.el.setAttribute('tabindex', '0');
      }
    }

    // Shadow inner mask element to avoid layout thrashing
    let inner = this.el.querySelector('.prism-sprite-mask');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'prism-sprite-mask';
      this.el.appendChild(inner);
    }
    this.maskEl = inner;

    // Apply base CSS variables and initial frame position
    this.updateStyles();
    this.setFrame(0);
  }

  updateStyles() {
    const { columns, rows, iconColor, iconSize, spriteSheetUrl } = this.options;
    
    this.el.style.setProperty('--prism-icon-size', iconSize);
    this.el.style.setProperty('--prism-icon-color', iconColor);
    this.el.style.setProperty('--prism-cols', columns);
    this.el.style.setProperty('--prism-rows', rows);

    this.maskEl.style.setProperty('--sprite-url', `url("${spriteSheetUrl}")`);
    this.maskEl.style.setProperty('--mask-w', `${columns * 100}%`);
    this.maskEl.style.setProperty('--mask-h', `${rows * 100}%`);
  }

  preloadSprite() {
    const img = new Image();
    img.src = this.options.spriteSheetUrl;
    if (img.decode) {
      img.decode().catch(() => {});
    }
  }

  setFrame(frameIndex) {
    this.currentFrame = frameIndex;
    const { xPercent, yPercent } = calculateMaskPosition(
      frameIndex,
      this.options.columns,
      this.options.rows
    );

    this.maskEl.style.setProperty('--frame-x', `${xPercent}%`);
    this.maskEl.style.setProperty('--frame-y', `${yPercent}%`);
  }

  play() {
    if (this.prefersReducedMotion.matches) {
      // With reduced motion, do not play rapid frame flips
      return;
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPendingStop = false;
    this.startTime = performance.now();
    this.maskEl.classList.add('is-animating');

    this.el.dispatchEvent(new CustomEvent('prism:start', {
      bubbles: true,
      detail: { icon: this }
    }));

    const step = (timestamp) => {
      if (!this.isPlaying) return;

      const elapsed = timestamp - this.startTime;
      const rawProgress = elapsed / this.options.duration;

      if (rawProgress < 1) {
        const eased = cubicEaseInOut(rawProgress);
        const frame = calculateFrameIndex(eased, this.options.frameCount, this.options.holdWeights);
        this.setFrame(frame);
        this.rafId = requestAnimationFrame(step);
      } else {
        // One full cycle completed
        if (this.options.loopOnHover && this.isHovered && !this.isPendingStop) {
          // Loop again seamlessly
          this.startTime = performance.now();
          this.rafId = requestAnimationFrame(step);
        } else {
          // Finish gracefully on frame 0
          this.setFrame(0);
          this.isPlaying = false;
          this.maskEl.classList.remove('is-animating');

          this.el.dispatchEvent(new CustomEvent('prism:end', {
            bubbles: true,
            detail: { icon: this }
          }));
        }
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  reset() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isPlaying = false;
    this.isPendingStop = false;
    this.maskEl.classList.remove('is-animating');
    this.setFrame(0);
  }

  handlePointerEnter = () => {
    this.isHovered = true;
    this.isPendingStop = false;
    this.play();
  };

  handlePointerLeave = () => {
    this.isHovered = false;
    // Do not abruptly snap; complete current cycle gracefully
    this.isPendingStop = true;
  };

  handlePointerDown = (e) => {
    // Immediate playful reaction on tap/click without sticky touch hover
    this.play();
  };

  handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.play();
    }
  };

  bindEvents() {
    const trig = this.options.trigger;

    if (trig === 'hover' || trig === 'both') {
      this.el.addEventListener('pointerenter', this.handlePointerEnter);
      this.el.addEventListener('pointerleave', this.handlePointerLeave);
    }

    if (trig === 'tap' || trig === 'both') {
      this.el.addEventListener('pointerdown', this.handlePointerDown);
    }

    this.el.addEventListener('keydown', this.handleKeyDown);
  }

  unbindEvents() {
    this.el.removeEventListener('pointerenter', this.handlePointerEnter);
    this.el.removeEventListener('pointerleave', this.handlePointerLeave);
    this.el.removeEventListener('pointerdown', this.handlePointerDown);
    this.el.removeEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    this.reset();
    this.unbindEvents();
  }
}

/**
 * Custom Web Component <prism-sprite-icon>
 */
export class PrismSpriteIconElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'sprite-sheet-url',
      'frame-count',
      'rows',
      'columns',
      'duration',
      'loop-on-hover',
      'icon-color',
      'icon-size',
      'trigger',
      'aria-label'
    ];
  }

  constructor() {
    super();
    this.controller = null;
  }

  connectedCallback() {
    if (!this.controller) {
      this.initController();
    }
  }

  disconnectedCallback() {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.controller) {
      this.initController();
    }
  }

  initController() {
    if (this.controller) {
      this.controller.destroy();
    }

    this.controller = new SpriteIcon(this, {
      spriteSheetUrl: this.getAttribute('sprite-sheet-url') || '/assets/sprites/prism-sprite.webp',
      frameCount: Number(this.getAttribute('frame-count')) || 24,
      columns: Number(this.getAttribute('columns')) || 6,
      rows: Number(this.getAttribute('rows')) || 4,
      duration: Number(this.getAttribute('duration')) || 1100,
      loopOnHover: this.hasAttribute('loop-on-hover') && this.getAttribute('loop-on-hover') !== 'false',
      iconColor: this.getAttribute('icon-color') || 'currentColor',
      iconSize: this.getAttribute('icon-size') || '120px',
      trigger: this.getAttribute('trigger') || 'both',
      ariaLabel: this.getAttribute('aria-label') || 'Prism animated mark'
    });
  }

  play() {
    if (this.controller) this.controller.play();
  }

  reset() {
    if (this.controller) this.controller.reset();
  }

  destroy() {
    if (this.controller) this.controller.destroy();
  }
}

// Register custom element safely
if (typeof customElements !== 'undefined' && !customElements.get('prism-sprite-icon')) {
  customElements.define('prism-sprite-icon', PrismSpriteIconElement);
}
