/**
 * Prism Sprite Icon Component
 * Custom Web Component <prism-sprite-icon> and JavaScript class SpriteIcon.
 * Uses high-performance CSS masking (mask-image + -webkit-mask-image) and
 * requestAnimationFrame easing to animate sprite sheets at 60fps.
 *
 * Supports:
 * - 6x4 (24-frame) bespoke Prism mark with handcrafted "on twos" holdWeights
 * - 18x17 (306-frame) Claude/Anthropic organic morphing sprite sheets
 * - trigger: 'hover' | 'tap' | 'both' | 'ambient' | 'none'
 * - easing: 'cubic' | 'linear'
 */

import {
  cubicEaseInOut,
  calculateFrameIndex,
  calculateLoopFrameIndex,
  calculateMaskPosition
} from './motion-math.js';

const DEFAULT_PRISM_HOLD_WEIGHTS = [
  2.5, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1.8, 1.8,
  1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1.5, 2.0
];

export class SpriteIcon {
  constructor(element, options = {}) {
    this.el = element;
    const frameCount = Number(options.frameCount) || 24;
    const easing = options.easing || (frameCount > 60 ? 'linear' : 'cubic');

    this.options = {
      spriteSheetUrl: options.spriteSheetUrl || '/assets/sprites/prism-sprite.webp',
      frameCount,
      columns: Number(options.columns) || 6,
      rows: Number(options.rows) || 4,
      duration: Number(options.duration) || (frameCount > 60 ? 5200 : 1100),
      easing,
      loopOnHover: Boolean(options.loopOnHover),
      iconColor: options.iconColor || 'currentColor',
      iconSize: options.iconSize || '120px',
      trigger: options.trigger || 'both', // 'hover' | 'tap' | 'both' | 'ambient' | 'none'
      ariaLabel: options.ariaLabel || 'Prism icon mark',
      startFrame: Number(options.startFrame) || 0,
      holdWeights:
        options.holdWeights !== undefined
          ? options.holdWeights
          : frameCount === 24
            ? DEFAULT_PRISM_HOLD_WEIGHTS
            : null,
      ...options
    };

    this.currentFrame = this.options.startFrame % this.options.frameCount;
    this.isPlaying = false;
    this.isHovered = false;
    this.isPendingStop = false;
    this.isVisible = true;
    this.startTime = null;
    this.ambientElapsed = (this.currentFrame / this.options.frameCount) * this.options.duration;
    this.lastTimestamp = null;
    this.rafId = null;
    this.observer = null;
    this.parentCard = null;

    // Media query for reduced motion
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.initDOM();
    this.bindEvents();
    this.preloadSprite();

    if (this.options.trigger === 'ambient') {
      this.startAmbientObserver();
    }
  }

  initDOM() {
    this.el.classList.add('prism-sprite-wrapper');
    this.el.setAttribute('data-animating', 'false');
    const isDecorative = Boolean(this.el.closest('[aria-hidden="true"]'));

    if (!isDecorative) {
      this.el.setAttribute('role', 'img');
      this.el.setAttribute('aria-label', this.options.ariaLabel);
      if (this.options.trigger !== 'none' && this.options.trigger !== 'ambient') {
        if (!this.el.hasAttribute('tabindex')) {
          this.el.setAttribute('tabindex', '0');
        }
      }
    }

    // Inner mask element to avoid layout thrashing
    let inner = this.el.querySelector('.prism-sprite-mask');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'prism-sprite-mask';
      this.el.appendChild(inner);
    }
    this.maskEl = inner;

    this.updateStyles();
    this.setFrame(this.currentFrame);
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

  startAmbientObserver() {
    if (this.prefersReducedMotion.matches) {
      this.setFrame(this.options.startFrame % this.options.frameCount);
      return;
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible && !this.isPlaying && !this.prefersReducedMotion.matches) {
              this.playAmbient();
            } else if (!this.isVisible && this.isPlaying) {
              this.pauseAmbient();
            }
          });
        },
        { threshold: 0.05 }
      );
      this.observer.observe(this.el);
    } else {
      this.playAmbient();
    }
  }

  playAmbient() {
    if (this.prefersReducedMotion.matches || this.isPlaying) return;

    this.isPlaying = true;
    this.el.setAttribute('data-animating', 'true');
    this.lastTimestamp = performance.now();
    this.maskEl.classList.add('is-animating');

    const stepAmbient = (timestamp) => {
      if (!this.isPlaying) return;
      if (document.visibilityState === 'hidden' || !this.isVisible) {
        this.pauseAmbient();
        return;
      }

      const dt = Math.min(80, Math.max(0, timestamp - this.lastTimestamp));
      this.lastTimestamp = timestamp;

      // Gently accelerate on hover for tactile feedback
      const speedMultiplier = this.isHovered ? 1.85 : 1.0;
      this.ambientElapsed += dt * speedMultiplier;

      const frame = calculateLoopFrameIndex(
        this.ambientElapsed,
        this.options.duration,
        this.options.frameCount,
        this.options.easing,
        this.options.holdWeights
      );
      if (frame !== this.currentFrame) {
        this.setFrame(frame);
      }

      this.rafId = requestAnimationFrame(stepAmbient);
    };

    this.rafId = requestAnimationFrame(stepAmbient);
  }

  pauseAmbient() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isPlaying = false;
    this.el.setAttribute('data-animating', 'false');
    this.maskEl.classList.remove('is-animating');
  }

  play() {
    if (this.prefersReducedMotion.matches) {
      return;
    }

    if (this.options.trigger === 'ambient') {
      this.playAmbient();
      return;
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPendingStop = false;
    this.startTime = performance.now();
    this.el.setAttribute('data-animating', 'true');
    this.maskEl.classList.add('is-animating');

    this.el.dispatchEvent(new CustomEvent('prism:start', {
      bubbles: true,
      detail: { icon: this }
    }));

    const step = (timestamp) => {
      if (!this.isPlaying) return;

      const elapsed = timestamp - this.startTime;

      if (this.options.loopOnHover && this.isHovered && !this.isPendingStop) {
        const frame = calculateLoopFrameIndex(
          elapsed,
          this.options.duration,
          this.options.frameCount,
          this.options.easing,
          this.options.holdWeights
        );
        if (frame !== this.currentFrame) {
          this.setFrame(frame);
        }
        this.rafId = requestAnimationFrame(step);
        return;
      }

      const rawProgress = elapsed / this.options.duration;

      if (rawProgress < 1 && !(this.isPendingStop && (this.options.loopOnHover || this.options.frameCount > 60))) {
        const progress = this.options.easing === 'cubic' ? cubicEaseInOut(rawProgress) : rawProgress;
        const frame = calculateFrameIndex(progress, this.options.frameCount, this.options.holdWeights);
        if (frame !== this.currentFrame) {
          this.setFrame(frame);
        }
        this.rafId = requestAnimationFrame(step);
      } else {
        this.setFrame(this.options.startFrame % this.options.frameCount);
        this.isPlaying = false;
        this.el.setAttribute('data-animating', 'false');
        this.maskEl.classList.remove('is-animating');

        this.el.dispatchEvent(new CustomEvent('prism:end', {
          bubbles: true,
          detail: { icon: this }
        }));
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
    this.el.setAttribute('data-animating', 'false');
    this.maskEl.classList.remove('is-animating');
    this.setFrame(this.options.startFrame % this.options.frameCount);
  }

  handlePointerEnter = () => {
    this.isHovered = true;
    this.isPendingStop = false;
    if (this.options.trigger !== 'ambient') {
      this.play();
    }
  };

  handlePointerLeave = () => {
    this.isHovered = false;
    this.isPendingStop = true;
    if (this.options.trigger !== 'ambient' && (this.options.loopOnHover || this.options.frameCount > 60)) {
      this.reset();
    }
  };

  handlePointerDown = () => {
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

    if (trig === 'hover' || trig === 'both' || trig === 'ambient') {
      this.parentCard =
        this.el.closest('.editorial-card, .timeline-step-card, .pricing-card, .qualification-note-box, .demo-preview-box') ||
        this.el;
      this.parentCard.addEventListener('pointerenter', this.handlePointerEnter);
      this.parentCard.addEventListener('pointerleave', this.handlePointerLeave);
    }

    if (trig === 'tap' || trig === 'both') {
      this.el.addEventListener('pointerdown', this.handlePointerDown);
    }

    if (trig !== 'none' && trig !== 'ambient') {
      this.el.addEventListener('keydown', this.handleKeyDown);
    }
  }

  unbindEvents() {
    this.el.removeEventListener('pointerenter', this.handlePointerEnter);
    this.el.removeEventListener('pointerleave', this.handlePointerLeave);
    this.el.removeEventListener('pointerdown', this.handlePointerDown);
    this.el.removeEventListener('keydown', this.handleKeyDown);
    if (this.parentCard) {
      this.parentCard.removeEventListener('pointerenter', this.handlePointerEnter);
      this.parentCard.removeEventListener('pointerleave', this.handlePointerLeave);
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
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
      'easing',
      'start-frame',
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

    const frameCount = Number(this.getAttribute('frame-count')) || 24;
    const easingAttr = this.getAttribute('easing');

    this.controller = new SpriteIcon(this, {
      spriteSheetUrl: this.getAttribute('sprite-sheet-url') || '/assets/sprites/prism-sprite.webp',
      frameCount,
      columns: Number(this.getAttribute('columns')) || 6,
      rows: Number(this.getAttribute('rows')) || 4,
      duration: Number(this.getAttribute('duration')) || (frameCount > 60 ? 5200 : 1100),
      easing: easingAttr || (frameCount > 60 ? 'linear' : 'cubic'),
      startFrame: Number(this.getAttribute('start-frame')) || 0,
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
