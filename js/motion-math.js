/**
 * Pure mathematical functions for Prism animation, easing, sprite positioning, and pricing logic.
 * Decoupled from DOM for deterministic testing and zero-overhead execution.
 */

/**
 * Standard cubic-bezier ease-in-out approximation (0.42, 0, 0.58, 1)
 * Maps progress t in [0, 1] to eased value in [0, 1].
 */
export function cubicEaseInOut(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Smooth Hermite-like ease-in-out (smoothstep)
 */
export function smoothstep(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Maps normalized animation progress [0, 1] to integer frame index [0, totalFrames - 1].
 * Optionally applies hold weights so key poses (e.g. frame 0, apex frame 12) linger ("on twos" feel).
 * 
 * @param {number} progress - Normalized time progress between 0 and 1
 * @param {number} totalFrames - Total number of frames (e.g. 24)
 * @param {number[]|null} [holdWeights=null] - Array of weights per frame
 * @returns {number} Frame index integer from 0 to totalFrames - 1
 */
export function calculateFrameIndex(progress, totalFrames = 24, holdWeights = null) {
  if (totalFrames <= 1) return 0;
  const clamped = Math.max(0, Math.min(1, progress));

  if (!holdWeights || holdWeights.length !== totalFrames) {
    const rawIndex = Math.floor(clamped * totalFrames);
    return Math.min(totalFrames - 1, rawIndex);
  }

  const totalWeight = holdWeights.reduce((a, b) => a + b, 0);
  const targetWeight = clamped * totalWeight;
  let accumulated = 0;

  for (let i = 0; i < totalFrames; i++) {
    accumulated += holdWeights[i];
    if (targetWeight <= accumulated || i === totalFrames - 1) {
      return i;
    }
  }
  return totalFrames - 1;
}

/**
 * Computes the next frame index for seamless continuous sprite-sheet loops (e.g. 18x17 = 306 frames).
 * @param {number} elapsedMs - Elapsed time in milliseconds
 * @param {number} durationMs - Full cycle duration in milliseconds
 * @param {number} totalFrames - Total frames in the sprite grid
 * @param {'linear'|'cubic'} [easing='linear'] - Easing mode
 * @param {number[]|null} [holdWeights=null] - Optional per-frame hold weights
 * @returns {number}
 */
export function calculateLoopFrameIndex(
  elapsedMs,
  durationMs = 5100,
  totalFrames = 306,
  easing = 'linear',
  holdWeights = null
) {
  if (totalFrames <= 1 || durationMs <= 0) return 0;
  const wrapped = ((elapsedMs % durationMs) + durationMs) % durationMs;
  const rawProgress = wrapped / durationMs;
  const progress = easing === 'cubic' ? cubicEaseInOut(rawProgress) : rawProgress;
  return calculateFrameIndex(progress, totalFrames, holdWeights);
}

/**
 * Calculates CSS percentage coordinates for mask-position given a frame index in a grid.
 * In CSS mask-position, 0% is the first frame, and 100% is the last frame in that axis.
 * Formula for N columns: percentage = (col / (cols - 1)) * 100%
 * 
 * @param {number} frameIndex - 0-indexed frame number
 * @param {number} cols - Number of columns in sprite sheet (e.g. 6)
 * @param {number} rows - Number of rows in sprite sheet (e.g. 4)
 * @returns {{ xPercent: number, yPercent: number, col: number, row: number }}
 */
export function calculateMaskPosition(frameIndex, cols = 6, rows = 4) {
  const safeIndex = Math.max(0, Math.min(frameIndex, (cols * rows) - 1));
  const col = safeIndex % cols;
  const row = Math.floor(safeIndex / cols);

  const xPercent = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const yPercent = rows > 1 ? (row / (rows - 1)) * 100 : 0;

  return {
    xPercent: Number(xPercent.toFixed(4)),
    yPercent: Number(yPercent.toFixed(4)),
    col,
    row
  };
}

/**
 * Pure calculation for fine-tuning vs frontier API token economics.
 * Demonstrates the cost savings of distilling into an 8B/14B fine-tuned model.
 * 
 * @param {number} monthlyTokensMillions - Monthly input/output tokens in millions
 * @param {number} frontierCostPerMillion - Cost per million for general frontier model ($/1M tokens)
 * @param {number} prismCostPerMillion - Cost per million for fine-tuned small model ($/1M tokens)
 * @returns {{ monthlySavings: number, annualSavings: number, percentSaved: number }}
 */
export function calculateTokenEconomics(
  monthlyTokensMillions,
  frontierCostPerMillion = 15.0, // e.g. $15/1M tokens for proprietary frontier model
  prismCostPerMillion = 1.2      // e.g. $1.20/1M tokens for dedicated fine-tuned 8B/14B
) {
  const frontierTotal = monthlyTokensMillions * frontierCostPerMillion;
  const prismTotal = monthlyTokensMillions * prismCostPerMillion;
  const monthlySavings = Math.max(0, frontierTotal - prismTotal);
  const annualSavings = monthlySavings * 12;
  const percentSaved = frontierTotal > 0 ? ((frontierTotal - prismTotal) / frontierTotal) * 100 : 0;

  return {
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),
    percentSaved: Math.round(percentSaved)
  };
}
