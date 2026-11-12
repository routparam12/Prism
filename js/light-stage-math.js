/**
 * Pure mathematical functions for the Prism Light Stage.
 * Decoupled from WebGL context and DOM for deterministic testing and reuse.
 */

/**
 * 7 Spectral anchor hues as specified:
 * Red #ff3b30, Orange #ff9500, Yellow #ffd60a, Green #34c759,
 * Cyan #32ade6, Indigo #5856d6, Violet #af52de
 */
export const SPECTRUM_COLORS = [
  { r: 255 / 255, g: 59 / 255, b: 48 / 255 },   // Red #ff3b30
  { r: 255 / 255, g: 149 / 255, b: 0 / 255 },   // Orange #ff9500
  { r: 255 / 255, g: 214 / 255, b: 10 / 255 },  // Yellow #ffd60a
  { r: 52 / 255, g: 199 / 255, b: 89 / 255 },   // Green #34c759
  { r: 50 / 255, g: 173 / 255, b: 230 / 255 },  // Cyan #32ade6
  { r: 88 / 255, g: 86 / 255, b: 214 / 255 },   // Indigo #5856d6
  { r: 175 / 255, g: 82 / 255, b: 222 / 255 }   // Violet #af52de
];

/**
 * Linearly interpolates between two numbers.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Smooth Hermite interpolation (smoothstep)
 * @param {number} edge0
 * @param {number} edge1
 * @param {number} x
 * @returns {number}
 */
export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Maps normalized spectrum parameter t ∈ [0, 1] to continuous RGB color.
 * Blends smoothly across the 7 spectral target hues.
 * @param {number} t
 * @returns {{r: number, g: number, b: number}}
 */
export function interpolateSpectrum(t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const segmentCount = SPECTRUM_COLORS.length - 1;
  const scaled = clampedT * segmentCount;
  const index = Math.min(Math.floor(scaled), segmentCount - 1);
  const frac = scaled - index;

  // Smooth blending across segment boundary
  const smoothFrac = frac * frac * (3 - 2 * frac);

  const c0 = SPECTRUM_COLORS[index];
  const c1 = SPECTRUM_COLORS[index + 1];

  return {
    r: c0.r + (c1.r - c0.r) * smoothFrac,
    g: c0.g + (c1.g - c0.g) * smoothFrac,
    b: c0.b + (c1.b - c0.b) * smoothFrac
  };
}

/**
 * Calculates fan boundaries and pulse response.
 * @param {number} baseCenterAngle Center direction in radians (e.g. 0.06 rad)
 * @param {number} baseSpread Total fan spread in radians (e.g. 0.42 rad ~ 24 deg)
 * @param {number} [pulse=0] Pulse amplitude [0, 1]
 * @returns {{minAngle: number, maxAngle: number, spread: number}}
 */
export function calculateFanBounds(baseCenterAngle, baseSpread, pulse = 0) {
  const pulseSpreadMultiplier = 1.0 + 0.15 * Math.max(0, Math.min(1, pulse));
  const spread = baseSpread * pulseSpreadMultiplier;
  return {
    minAngle: baseCenterAngle - spread * 0.5,
    maxAngle: baseCenterAngle + spread * 0.5,
    spread
  };
}

/**
 * Two-stage entrance progress calculator:
 * Stage 1 (0 to 700ms): Beam enters from left and reaches prism face (progress 0.0 to 0.45)
 * Stage 2 (700ms to 1600ms): Spectrum opens from prism with ease-out (progress 0.45 to 1.0)
 * @param {number} elapsedMs
 * @param {number} [totalDurationMs=1600]
 * @returns {{overall: number, beamProgress: number, spectrumProgress: number}}
 */
export function calculateEntranceProgress(elapsedMs, totalDurationMs = 1600) {
  if (elapsedMs <= 0) {
    return { overall: 0, beamProgress: 0, spectrumProgress: 0 };
  }
  if (elapsedMs >= totalDurationMs) {
    return { overall: 1, beamProgress: 1, spectrumProgress: 1 };
  }

  const beamDuration = 700;
  const beamProgress = Math.min(1, elapsedMs / beamDuration);
  // Ease-out cubic for beam
  const easedBeam = 1 - Math.pow(1 - beamProgress, 3);

  let spectrumProgress = 0;
  if (elapsedMs > beamDuration) {
    const specElapsed = elapsedMs - beamDuration;
    const specDuration = totalDurationMs - beamDuration;
    const raw = Math.min(1, specElapsed / specDuration);
    // Smooth ease-out
    spectrumProgress = 1 - Math.pow(1 - raw, 2.5);
  }

  const overall = easedBeam * 0.45 + spectrumProgress * 0.55;

  return {
    overall,
    beamProgress: easedBeam,
    spectrumProgress
  };
}

/**
 * Calculates hairline streak intensity distribution.
 * Creates sharp, varied streaks rather than a flat gradient.
 * @param {number} angleFrac
 * @param {number} [frequency=72]
 * @param {number} [seed=0.5]
 * @returns {number}
 */
export function calculateStreakDistribution(angleFrac, frequency = 72, seed = 0.5) {
  // Harmonic layering of frequencies creates fine hairline strands with natural gaps
  const h1 = Math.sin(angleFrac * frequency * Math.PI * 2 + seed);
  const h2 = Math.sin(angleFrac * frequency * 2.3 * Math.PI * 2 + seed * 1.7);
  const h3 = Math.cos(angleFrac * frequency * 4.7 * Math.PI * 2 - seed * 2.1);

  // Combine and shape into sharp peaks (hairlines)
  const combined = (h1 * 0.5 + h2 * 0.35 + h3 * 0.15 + 1.0) * 0.5;
  // Non-linear power curve thins the bands into fine luminous filaments
  return Math.pow(Math.max(0, combined), 2.2);
}
