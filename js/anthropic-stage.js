/**
 * Anthropic-Style SVG Light Stage Controller
 *
 * Implements:
 * 1. Warm cream background with subtle engineering/Cartesian grid.
 * 2. Real SVG <filter id="mk-marker"> with ink turbulence, displacement, and grain.
 * 3. Compositing with mix-blend-mode: multiply (light theme) and screen (dark theme).
 * 4. Beams reflecting from the glass prism that slowly advance from left to right,
 *    featuring continuous dashed/stippled marker texture flow.
 * 5. Glass prism geometry, interactive pulse, and navbar logo synchronization.
 */

import {
  generateSpectralRayCollection,
  generateIncomingBeamData
} from './anthropic-stage-paths.js';

export class AnthropicLightStage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign(
      {
        rayCount: 32,
        speed: 1.0,
        streaming: true,
        onPulse: null
      },
      options
    );

    this.svg = null;
    this.beamGroup = null;
    this.clipRect = null;
    this.rays = [];
    this.incomingBeams = [];
    this.rafId = null;
    this.dashOffsets = [];
    this.incomingOffsets = [];
    this.isDestroyed = false;
    this.isVisible = true;
    this.pulse = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.buildSVG();
    this.bindEvents();
    this.triggerEntrance();
    this.startStreamingLoop();
  }

  buildSVG() {
    this.container.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'anthropic-stage-svg');
    svg.setAttribute('viewBox', '0 0 1200 440');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    // Prism geometry anchor points
    const prismExitX = 318;
    const prismExitY = 218;
    const prismEntryX = 238;
    const prismEntryY = 220;

    // Generate incoming beam strands
    this.incomingBeams = generateIncomingBeamData(-20, prismEntryX, prismEntryY);
    this.incomingOffsets = new Float32Array(this.incomingBeams.length);

    // Generate spectral rays collection emerging from prism exit facet
    this.rays = generateSpectralRayCollection(
      this.options.rayCount,
      prismExitX,
      prismExitY,
      1240, // endX (spans across to right edge)
      30,   // minY (crimson/rose)
      410   // maxY (indigo/violet)
    );
    this.dashOffsets = new Float32Array(this.rays.length);

    svg.innerHTML = `
      <defs>
        <!-- Anthropic Marker Filter (Turbulence + ColorMatrix + Composite + Warp) -->
        <filter id="mk-marker" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="7" result="grain"></feTurbulence>
          <feColorMatrix in="grain" type="luminanceToAlpha" result="ga"></feColorMatrix>
          <feComposite in="SourceGraphic" in2="ga" operator="arithmetic" k1="0" k2="1" k3="-0.30" k4="0" result="inked"></feComposite>
          <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="11" result="warp"></feTurbulence>
          <feDisplacementMap in="inked" in2="warp" scale="2.6" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
        </filter>

        <!-- Subtle Rule Filter for Notebook Grid -->
        <filter id="mk-rule" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="1" seed="3" result="warp"></feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.0" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
        </filter>

        <!-- Cartesian Grid Pattern (Anthropic Engineering Notebook Style) -->
        <pattern id="anthropicGrid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" class="grid-path" stroke-width="0.85" />
        </pattern>

        <!-- Entrance Reveal Clip Path -->
        <clipPath id="stageEntranceClip">
          <rect id="entranceClipRect" x="0" y="-50" width="1300" height="540" />
        </clipPath>
      </defs>

      <!-- 1. Background Cartesian Grid Layer -->
      <g filter="url(#mk-rule)" opacity="0.65">
        <rect width="100%" height="100%" fill="url(#anthropicGrid)" />
      </g>

      <!-- 2. Main Animated Beam & Dispersion Group with Anthropic Filter & Blend Mode -->
      <g id="anthropicMarkerGroup" class="anthropic-marker-layer" filter="url(#mk-marker)" clip-path="url(#stageEntranceClip)">
        
        <!-- Incoming Multi-Strand White Light Beam (Enters from left into prism) -->
        <g class="incoming-beam-group">
          <!-- Soft paper pencil shadow for physical grounding -->
          <line x1="-30" y1="222" x2="${prismEntryX + 1}" y2="222" stroke="rgba(20, 20, 19, 0.09)" stroke-width="5" class="beam-shadow" />
          
          ${this.incomingBeams
            .map(
              (beam) => `
            <line
              id="${beam.id}"
              class="incoming-beam-strand"
              x1="${beam.x1}"
              y1="${beam.y1}"
              x2="${beam.x2}"
              y2="${beam.y2}"
              stroke="${beam.colorLight}"
              data-color-light="${beam.colorLight}"
              data-color-dark="${beam.colorDark}"
              stroke-width="${beam.strokeWidth}"
              stroke-opacity="${beam.opacity}"
              stroke-dasharray="${beam.dashArray}"
              stroke-linecap="round"
            />
          `
            )
            .join('')}
        </g>

        <!-- Glass Prism 3D Geometry matching Image 2 & Brand Mark -->
        <g class="glass-prism-group">
          <!-- Translucent faceted fills -->
          <polygon points="280,85 200,345 350,345" class="prism-facet-front" />
          <polygon points="280,85 350,345 390,305" class="prism-facet-side" />
          <polygon points="200,345 350,345 390,305 240,305" class="prism-facet-base" />

          <!-- Thin glassy outline strokes -->
          <line x1="280" y1="85" x2="200" y2="345" class="prism-line" stroke-width="1.6" />
          <line x1="280" y1="85" x2="350" y2="345" class="prism-line" stroke-width="1.6" />
          <line x1="200" y1="345" x2="350" y2="345" class="prism-line" stroke-width="1.6" />
          <line x1="280" y1="85" x2="390" y2="305" class="prism-line" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.6" />
          <line x1="350" y1="345" x2="390" y2="305" class="prism-line" stroke-width="1.3" />
          <line x1="200" y1="345" x2="240" y2="305" class="prism-line" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.5" />
          <line x1="240" y1="305" x2="390" y2="305" class="prism-line" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.5" />

          <!-- Internal Refraction Beam connecting left facet hit to right facet exit -->
          <line
            x1="${prismEntryX}"
            y1="${prismEntryY}"
            x2="${prismExitX}"
            y2="${prismExitY}"
            class="internal-refract-beam"
            stroke-width="3.2"
            stroke-linecap="round"
          />

          <!-- Entry and exit bloom spotlights -->
          <circle cx="${prismEntryX}" cy="${prismEntryY}" r="4.5" class="bloom-spot" />
          <circle cx="${prismExitX}" cy="${prismExitY}" r="5.5" class="bloom-spot" />
        </g>

        <!-- 3. Spectral Rays Fan Group (Ordered top to bottom, streaming left to right) -->
        <g id="spectralFanGroup" class="spectral-fan-group">
          ${this.rays
            .map(
              (r) => `
            <path
              id="${r.id}"
              class="spectral-ray-path"
              d="${r.d}"
              fill="none"
              stroke="${r.colorLight}"
              data-color-light="${r.colorLight}"
              data-color-dark="${r.colorDark}"
              stroke-width="${r.strokeWidth}"
              stroke-opacity="${r.opacity}"
              stroke-dasharray="${r.dashArray}"
              stroke-linecap="round"
            />
          `
            )
            .join('')}
        </g>
      </g>
    `;

    this.container.appendChild(svg);
    this.svg = svg;
    this.clipRect = svg.querySelector('#entranceClipRect');
    this.beamGroup = svg.querySelector('#anthropicMarkerGroup');
    this.pathElements = Array.from(svg.querySelectorAll('.spectral-ray-path'));
    this.incomingElements = Array.from(svg.querySelectorAll('.incoming-beam-strand'));

    // Append accessible hit target over prism
    const hit = document.createElement('div');
    hit.className = 'anthropic-stage-hit';
    hit.setAttribute('role', 'button');
    hit.setAttribute('tabindex', '0');
    hit.setAttribute('aria-label', 'Prism optical core: hover or activate to pulse dispersion');
    this.container.appendChild(hit);
    this.hitArea = hit;

    this.updateThemeColors();
  }

  updateThemeColors() {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (this.beamGroup) {
      this.beamGroup.style.mixBlendMode = isDark ? 'screen' : 'multiply';
    }

    // Update incoming beam strokes
    if (this.incomingElements) {
      this.incomingElements.forEach((line) => {
        const color = isDark
          ? line.getAttribute('data-color-dark')
          : line.getAttribute('data-color-light');
        if (color) line.setAttribute('stroke', color);
      });
    }

    // Update spectral ray strokes
    if (this.pathElements) {
      this.pathElements.forEach((path) => {
        const color = isDark
          ? path.getAttribute('data-color-dark')
          : path.getAttribute('data-color-light');
        if (color) {
          path.setAttribute('stroke', color);
        }
      });
    }
  }

  triggerEntrance() {
    if (this.reducedMotion || !this.clipRect) {
      if (this.clipRect) this.clipRect.setAttribute('width', '1300');
      return;
    }

    // Smooth left-to-right entrance wipe
    const duration = 1800;
    const start = performance.now();

    const animateEntrance = (now) => {
      if (this.isDestroyed) return;
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(1, elapsed / duration);
      // Gentle ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 2.8);
      const width = Math.max(0, Math.round(eased * 1300));

      if (this.clipRect) {
        this.clipRect.setAttribute('width', width.toString());
      }

      if (progress < 1) {
        requestAnimationFrame(animateEntrance);
      }
    };

    requestAnimationFrame(animateEntrance);
  }

  startStreamingLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      if (this.isDestroyed) return;

      const dt = Math.min(0.1, (now - lastTime) * 0.001);
      lastTime = now;

      // Pointer smoothing
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

      // Pulse decay
      if (this.pulse > 0.001) {
        this.pulse *= 0.94;
      } else {
        this.pulse = 0;
      }

      if (this.isVisible && !this.reducedMotion) {
        const baseSpeed = 24 * this.options.speed; // px per second for visible left-to-right drift
        const pulseBoost = 1.0 + 1.2 * this.pulse;

        // 1. Stream incoming beam from left into prism
        if (this.incomingElements) {
          for (let i = 0; i < this.incomingElements.length; i++) {
            const line = this.incomingElements[i];
            const speedFactor = this.incomingBeams[i].speed;
            this.incomingOffsets[i] -= baseSpeed * speedFactor * pulseBoost * dt;
            if (this.incomingOffsets[i] < -500) {
              this.incomingOffsets[i] += 500;
            }
            line.style.strokeDashoffset = this.incomingOffsets[i].toFixed(2);
          }
        }

        // 2. Stream spectral rays reflecting from prism to the right
        if (this.pathElements) {
          for (let i = 0; i < this.pathElements.length; i++) {
            const path = this.pathElements[i];
            const speedFactor = this.rays[i].speed;
            // Negative offset advances dashes from left to right along the path
            this.dashOffsets[i] -= baseSpeed * speedFactor * pulseBoost * dt;
            
            if (this.dashOffsets[i] < -1000) {
              this.dashOffsets[i] += 1000;
            }

            path.style.strokeDashoffset = this.dashOffsets[i].toFixed(2);
          }
        }

        // Apply gentle pointer tilt and pulse spread
        if (this.beamGroup) {
          const rot = (this.mouse.y * 1.2).toFixed(2);
          const scaleSpread = (1.0 + 0.12 * this.pulse).toFixed(3);
          this.beamGroup.style.transformOrigin = '318px 218px';
          this.beamGroup.style.transform = `rotate(${rot}deg) scale(1, ${scaleSpread})`;
        }
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  pulseDispersion() {
    this.pulse = 1.0;
    if (typeof this.options.onPulse === 'function') {
      this.options.onPulse();
    }
    // Sync with navbar sprite icon
    const navIcon = document.querySelector('.nav-brand-logo prism-sprite-icon');
    if (navIcon && typeof navIcon.play === 'function') {
      navIcon.play();
    }
  }

  bindEvents() {
    // Pointer move for organic tilt
    this.onPointerMove = (e) => {
      if (this.reducedMotion) return;
      const rect = this.container.getBoundingClientRect();
      this.mouse.targetX = (e.clientX - rect.left) / rect.width - 0.5;
      this.mouse.targetY = (e.clientY - rect.top) / rect.height - 0.5;
    };
    this.container.addEventListener('pointermove', this.onPointerMove, { passive: true });

    // Click/hover on prism core triggers pulse
    const onTrigger = () => this.pulseDispersion();
    this.hitArea.addEventListener('pointerdown', onTrigger);
    this.hitArea.addEventListener('mouseenter', onTrigger);
    this.hitArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTrigger();
      }
    });

    // Touch tap
    this.container.addEventListener('touchstart', onTrigger, { passive: true });

    // IntersectionObserver to pause loop when offscreen
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    this.observer.observe(this.container);

    // Visibility change
    this.onVisibilityChange = () => {
      this.isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Watch for theme toggle changes
    this.themeObserver = new MutationObserver(() => this.updateThemeColors());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.observer) this.observer.disconnect();
    if (this.themeObserver) this.themeObserver.disconnect();
  }
}
