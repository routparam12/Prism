/**
 * Prism Light Stage — High-craft WebGL Refraction & Spectral Dispersion Engine
 *
 * Implements:
 * 1. Thin white incoming beam from left edge with Tyndall halo and subtle drift.
 * 2. 3D thin-edged glass prism with internal refraction and focal bloom.
 * 3. 7-color continuous spectral fan (Red, Orange, Yellow, Green, Cyan, Indigo, Violet)
 *    with fine hairline-streaked noise, angle dispersion, and distance falloff.
 * 4. Additive blending (dark theme / dark inset) & Multiply blending (cream theme).
 * 5. Full interaction: pointer tracking, entrance easing, pulse on hover/tap,
 *    nav logo sync, scroll fade/parallax, reduced-motion override, and SVG fallback.
 */

import {
  SPECTRUM_COLORS,
  lerp,
  calculateFanBounds,
  calculateEntranceProgress
} from './light-stage-math.js';

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  v_uv.y = 1.0 - v_uv.y; // Standard top-down coordinates
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_pulse;
uniform float u_theme;         // 0.0 = dark additive, 1.0 = light multiply
uniform float u_entrance;      // 0.0 to 1.0
uniform float u_beamProgress;  // 0.0 to 1.0
uniform float u_specProgress;  // 0.0 to 1.0
uniform float u_reducedMotion; // 1.0 if reduced motion
uniform float u_intensity;

varying vec2 v_uv;

// Pseudo-random noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 7 Spectral hues: Red, Orange, Yellow, Green, Cyan, Indigo, Violet
vec3 getSpectrum(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c[7];
  c[0] = vec3(1.0, 0.231, 0.188);   // #ff3b30 Red
  c[1] = vec3(1.0, 0.584, 0.0);     // #ff9500 Orange
  c[2] = vec3(1.0, 0.839, 0.039);   // #ffd60a Yellow
  c[3] = vec3(0.204, 0.780, 0.349); // #34c759 Green
  c[4] = vec3(0.196, 0.678, 0.902); // #32ade6 Cyan
  c[5] = vec3(0.345, 0.337, 0.839); // #5856d6 Indigo
  c[6] = vec3(0.686, 0.322, 0.871); // #af52de Violet

  float scaled = t * 6.0;
  int idx = int(floor(scaled));
  float f = fract(scaled);
  f = f * f * (3.0 - 2.0 * f); // Smoothstep blending between bands

  if (idx <= 0) return mix(c[0], c[1], f);
  if (idx == 1) return mix(c[1], c[2], f);
  if (idx == 2) return mix(c[2], c[3], f);
  if (idx == 3) return mix(c[3], c[4], f);
  if (idx == 4) return mix(c[4], c[5], f);
  return mix(c[5], c[6], f);
}

// Distance from point to line segment
float distToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  
  // Responsive layout anchors
  bool isMobile = (u_resolution.x < 640.0);
  
  // Prism geometry coordinates in UV space
  vec2 prismEntry = isMobile ? vec2(0.32, 0.42) : vec2(0.36, 0.48);
  vec2 prismExit  = isMobile ? vec2(0.42, 0.45) : vec2(0.43, 0.48);
  
  // Dynamic pointer nudge (calm 2-degree tilt)
  vec2 ptrNudge = (u_pointer - vec2(0.5)) * 0.04 * (1.0 - u_reducedMotion);
  vec2 beamStart = isMobile ? vec2(-0.02, 0.32 + ptrNudge.y * 0.5) : vec2(-0.02, 0.54 + ptrNudge.y);
  vec2 targetEntry = prismEntry + ptrNudge * 0.3;
  vec2 targetExit  = prismExit + ptrNudge * 0.2;

  // Background base color
  vec3 col = (u_theme < 0.5) ? vec3(0.043, 0.043, 0.047) : vec3(0.980, 0.976, 0.961); // #0B0B0C or #FAF9F5
  float alpha = 1.0;

  // 1. INCOMING WHITE BEAM
  float beamCutoff = mix(beamStart.x, targetEntry.x, u_beamProgress);
  float distBeam = distToSegment(uv, beamStart, targetEntry);
  
  // Soft Tyndall motes drifting along beam
  float mote = 0.0;
  if (u_reducedMotion < 0.5) {
    float motePhase = fract(u_time * 0.04 + uv.x * 2.0);
    float moteDist = abs(uv.y - mix(beamStart.y, targetEntry.y, uv.x / targetEntry.x));
    mote = smoothstep(0.015, 0.0, moteDist) * smoothstep(0.1, 0.0, abs(motePhase - 0.5)) * 0.18;
  }
  
  float beamCore = exp(-distBeam * 160.0);
  float beamHalo = exp(-distBeam * 18.0) * 0.28;
  float beamFlicker = (u_reducedMotion > 0.5) ? 1.0 : (0.97 + 0.03 * sin(u_time * 4.0));
  float beamIntensity = (beamCore + beamHalo + mote) * beamFlicker;
  
  if (uv.x > beamCutoff) {
    beamIntensity *= smoothstep(0.04, 0.0, uv.x - beamCutoff);
  }

  // 2. INTERNAL PRISM REFRACTION PATH
  float distInternal = distToSegment(uv, targetEntry, targetExit);
  float internalIntensity = exp(-distInternal * 120.0) * 0.85 * u_beamProgress;
  
  // Entry & Exit focal blooms
  float bloomEntry = exp(-length(uv - targetEntry) * 35.0) * 0.9 * u_beamProgress;
  float bloomExit = exp(-length(uv - targetExit) * 30.0) * (0.8 + 0.5 * u_pulse) * u_specProgress;

  // 3. SPECTRAL DISPERSION FAN
  vec3 spectrumSum = vec3(0.0);
  float totalSpectrumAlpha = 0.0;
  
  if (uv.x >= targetExit.x - 0.01 && u_specProgress > 0.01) {
    vec2 d = uv - targetExit;
    float distFromExit = length(d);
    
    // Fan reach animated during entrance
    float maxFanReach = 1.2 * u_specProgress;
    float reachFade = smoothstep(maxFanReach, maxFanReach * 0.65, distFromExit);
    
    // Ray angle calculation
    float rayAngle = atan(d.y, d.x);
    
    // Target fan opening: ~22 to 28 degrees (approx 0.38 - 0.48 rad)
    float baseCenter = isMobile ? 0.22 : 0.05 + ptrNudge.y * 0.2;
    float baseSpread = isMobile ? 0.34 : 0.42;
    float pulseSpread = baseSpread * (1.0 + 0.15 * u_pulse);
    
    float minA = baseCenter - pulseSpread * 0.5;
    float maxA = baseCenter + pulseSpread * 0.5;
    
    // Normalized spectrum position across fan: 0.0 = top (Red), 1.0 = bottom (Violet)
    float specT = (rayAngle - minA) / max(0.001, maxA - minA);
    
    // Soft boundary feathering at top and bottom fan limits
    float edgeMask = smoothstep(0.0, 0.12, specT) * smoothstep(1.0, 0.88, specT);
    
    if (specT >= 0.0 && specT <= 1.0 && edgeMask > 0.001) {
      vec3 rayColor = getSpectrum(specT);
      
      // Fine hairline streak noise (high frequency harmonics stretched along radius)
      float streakCoord = rayAngle * (isMobile ? 85.0 : 135.0);
      float shimmer = (u_reducedMotion > 0.5) ? 1.0 : (0.86 + 0.14 * sin(streakCoord * 4.0 + u_time * 2.2));
      
      float h1 = sin(streakCoord * 6.28318);
      float h2 = sin(streakCoord * 14.45 + 1.2);
      float h3 = cos(streakCoord * 29.8 - 0.8);
      float streak = pow(clamp((h1 * 0.5 + h2 * 0.32 + h3 * 0.18 + 1.0) * 0.5, 0.0, 1.0), 2.4) * shimmer;
      
      // Distance intensity: bright and tight near prism, widening and soft falloff
      float distanceFalloff = exp(-distFromExit * 1.55);
      
      // Idle gentle breathing (8-12s loop)
      float breath = (u_reducedMotion > 0.5) ? 1.0 : (0.92 + 0.08 * sin(u_time * 0.65));
      
      // Faint secondary glow where rays reach stage boundary
      float borderGlow = smoothstep(0.72, 1.0, uv.x) * 0.12;
      
      float rayLuminance = (streak * 0.85 + 0.15 + borderGlow) * edgeMask * distanceFalloff * reachFade * breath;
      rayLuminance *= (1.0 + 0.45 * u_pulse) * u_intensity;
      
      spectrumSum = rayColor * rayLuminance;
      totalSpectrumAlpha = clamp(rayLuminance * 1.2, 0.0, 1.0);
    }
  }

  // 4. COMPOSITING ACCORDING TO THEME
  if (u_theme < 0.5) {
    // DARK THEME / DARK INSET: Screen / Additive blending
    vec3 whiteBeamCol = vec3(1.0, 0.99, 0.97) * (beamIntensity + internalIntensity + bloomEntry + bloomExit);
    col += whiteBeamCol;
    col += spectrumSum * 1.15;
    
    // Subtle film grain
    float grain = (hash(uv * u_resolution + vec2(fract(u_time * 1.3), fract(u_time * 2.7))) - 0.5) * 0.035;
    col += vec3(grain);
  } else {
    // LIGHT THEME (MULTIPLY ON CREAM):
    // In multiply mode, white beam has delicate warm core with subtle pencil shadow
    float beamShadow = exp(-distBeam * 8.0) * 0.06;
    col -= vec3(beamShadow);
    
    // Beam core renders with warm crispness
    vec3 beamTint = vec3(1.0, 0.98, 0.94);
    col = mix(col, beamTint, clamp(beamIntensity * 0.85, 0.0, 0.95));
    
    // Refraction bloom on entry/exit
    col = mix(col, vec3(1.0), clamp((bloomEntry + bloomExit) * 0.7, 0.0, 0.8));
    
    // Spectrum multiplied against cream
    vec3 multRays = vec3(1.0) - (vec3(1.0) - spectrumSum * 1.3) * totalSpectrumAlpha;
    col *= mix(vec3(1.0), multRays, totalSpectrumAlpha * 0.9);
    
    // Fine grain
    float grain = (hash(uv * u_resolution + vec2(fract(u_time * 0.9), fract(u_time * 1.7))) - 0.5) * 0.02;
    col -= vec3(grain);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export class LightStage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign(
      {
        intensity: 1.0,
        fanAngle: 24,
        speed: 1.0,
        grain: true,
        style: 'dark-inset', // 'dark-inset' | 'multiply-cream'
        onPulse: null
      },
      options
    );

    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.rafId = null;
    this.startTime = performance.now();
    this.pulseAmplitude = 0;
    this.lastFrameTime = performance.now();
    this.pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    this.isVisible = true;
    this.isDestroyed = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.adaptiveScale = 1.0;

    this.init();
  }

  init() {
    this.createElements();
    this.setupWebGL();
    this.bindEvents();
    this.startLoop();
  }

  createElements() {
    // Canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'light-stage-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.canvas);

    // Interactive hit area over the glass prism
    this.hitArea = document.createElement('div');
    this.hitArea.className = 'light-stage-hit';
    this.hitArea.setAttribute('role', 'button');
    this.hitArea.setAttribute('tabindex', '0');
    this.hitArea.setAttribute('aria-label', 'Prism optical core: hover or activate to pulse spectrum dispersion');
    this.container.appendChild(this.hitArea);

    // Listen for theme & reduced motion changes
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = (e) => {
      this.reducedMotion = e.matches;
    };
    this.motionQuery.addEventListener('change', this.onMotionChange);
  }

  setupWebGL() {
    try {
      this.gl = this.canvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance'
      }) || this.canvas.getContext('experimental-webgl');
    } catch (e) {
      this.gl = null;
    }

    if (!this.gl) {
      console.info('Prism: WebGL not available, keeping high-fidelity SVG fallback stage.');
      this.container.classList.add('has-webgl-fallback');
      return;
    }

    const gl = this.gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERTEX_SHADER_SOURCE);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FRAGMENT_SHADER_SOURCE);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn('Prism: Fragment shader compilation error:', gl.getShaderInfoLog(fs));
      this.container.classList.add('has-webgl-fallback');
      return;
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.warn('Prism: Shader linking error:', gl.getProgramInfoLog(this.program));
      this.container.classList.add('has-webgl-fallback');
      return;
    }

    gl.useProgram(this.program);

    // Full screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      pointer: gl.getUniformLocation(this.program, 'u_pointer'),
      pulse: gl.getUniformLocation(this.program, 'u_pulse'),
      theme: gl.getUniformLocation(this.program, 'u_theme'),
      entrance: gl.getUniformLocation(this.program, 'u_entrance'),
      beamProgress: gl.getUniformLocation(this.program, 'u_beamProgress'),
      specProgress: gl.getUniformLocation(this.program, 'u_specProgress'),
      reducedMotion: gl.getUniformLocation(this.program, 'u_reducedMotion'),
      intensity: gl.getUniformLocation(this.program, 'u_intensity')
    };

    this.resize();
  }

  resize() {
    if (!this.canvas || !this.gl) return;
    const rect = this.container.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const maxDpr = isMobile ? 1.5 : 2.0;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * this.adaptiveScale;

    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  bindEvents() {
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });

    // Pointer move over hero stage
    this.onPointerMove = (e) => {
      if (this.reducedMotion) return;
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.pointer.targetX = Math.max(0, Math.min(1, x));
      this.pointer.targetY = Math.max(0, Math.min(1, y));
    };
    this.container.addEventListener('pointermove', this.onPointerMove, { passive: true });

    // Trigger pulse on prism interaction
    const triggerPulse = () => this.pulse();
    this.hitArea.addEventListener('pointerdown', triggerPulse);
    this.hitArea.addEventListener('mouseenter', triggerPulse);
    this.hitArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPulse();
      }
    });

    // Tap anywhere on stage on touch devices
    this.onTouchStart = () => this.pulse();
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: true });

    // IntersectionObserver to pause rendering when offscreen
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    this.observer.observe(this.container);

    // Pause on tab visibility change
    this.onVisibilityChange = () => {
      this.isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  pulse() {
    this.pulseAmplitude = 1.0;
    if (typeof this.options.onPulse === 'function') {
      this.options.onPulse();
    }
    // Also trigger navbar sprite icon if present
    const navSprite = document.querySelector('.nav-brand-logo prism-sprite-icon');
    if (navSprite && typeof navSprite.play === 'function') {
      navSprite.play();
    }
  }

  setStyle(styleName) {
    this.options.style = styleName;
    this.container.setAttribute('data-stage-style', styleName);
  }

  startLoop() {
    const loop = (now) => {
      if (this.isDestroyed) return;

      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // Adaptive performance scaling if frame time exceeds 20ms (> ~50fps)
      if (delta > 22 && this.adaptiveScale > 0.75) {
        this.adaptiveScale = 0.75;
        this.resize();
      }

      if (this.isVisible && this.gl && this.program) {
        this.render(now);
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  render(now) {
    const gl = this.gl;
    const elapsed = now - this.startTime;

    // Smooth pointer lerp
    this.pointer.x = lerp(this.pointer.x, this.pointer.targetX, 0.06);
    this.pointer.y = lerp(this.pointer.y, this.pointer.targetY, 0.06);

    // Smooth pulse decay (approx 600ms duration)
    this.pulseAmplitude *= 0.94;
    if (this.pulseAmplitude < 0.001) this.pulseAmplitude = 0;

    // Entrance timing: 0-700ms beam, 700-1600ms spectrum
    const entrance = this.reducedMotion
      ? { overall: 1.0, beamProgress: 1.0, spectrumProgress: 1.0 }
      : calculateEntranceProgress(elapsed, 1600);

    // Determine current theme state
    const currentTheme = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // In dark-inset style, stage is always dark additive. In multiply-cream, light mode uses multiply.
    let themeValue = 0.0; // Dark additive
    if (this.options.style === 'multiply-cream' && currentTheme === 'light') {
      themeValue = 1.0; // Light multiply
    }

    gl.useProgram(this.program);

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.time, elapsed * 0.001 * this.options.speed);
    gl.uniform2f(this.uniforms.pointer, this.pointer.x, this.pointer.y);
    gl.uniform1f(this.uniforms.pulse, this.pulseAmplitude);
    gl.uniform1f(this.uniforms.theme, themeValue);
    gl.uniform1f(this.uniforms.entrance, entrance.overall);
    gl.uniform1f(this.uniforms.beamProgress, entrance.beamProgress);
    gl.uniform1f(this.uniforms.specProgress, entrance.spectrumProgress);
    gl.uniform1f(this.uniforms.reducedMotion, this.reducedMotion ? 1.0 : 0.0);
    gl.uniform1f(this.uniforms.intensity, this.options.intensity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.motionQuery) this.motionQuery.removeEventListener('change', this.onMotionChange);
    if (this.observer) this.observer.disconnect();

    if (this.gl && this.program) {
      const gl = this.gl;
      gl.deleteProgram(this.program);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }
}
