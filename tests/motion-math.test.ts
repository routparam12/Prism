import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cubicEaseInOut,
  smoothstep,
  calculateFrameIndex,
  calculateMaskPosition,
  calculateTokenEconomics
} from '../js/motion-math.js';

test('cubicEaseInOut boundaries and symmetry', () => {
  assert.equal(cubicEaseInOut(0), 0);
  assert.equal(cubicEaseInOut(1), 1);
  assert.equal(cubicEaseInOut(0.5), 0.5);
  // Clamping checks
  assert.equal(cubicEaseInOut(-0.5), 0);
  assert.equal(cubicEaseInOut(1.5), 1);
  // Eased acceleration and deceleration
  assert.ok(cubicEaseInOut(0.2) < 0.2, 'starts slow');
  assert.ok(cubicEaseInOut(0.8) > 0.8, 'ends slow/settling');
});

test('smoothstep boundaries', () => {
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(1), 1);
  assert.equal(smoothstep(0.5), 0.5);
});

test('calculateFrameIndex uniformly divides frames', () => {
  const total = 24;
  assert.equal(calculateFrameIndex(0, total), 0);
  assert.equal(calculateFrameIndex(0.01, total), 0);
  assert.equal(calculateFrameIndex(0.5, total), 12);
  assert.equal(calculateFrameIndex(0.999, total), 23);
  assert.equal(calculateFrameIndex(1.0, total), 23);
});

test('calculateFrameIndex respects hold weights for key poses', () => {
  // 4 frames: frame 0 has heavy weight 3, frames 1-3 have weight 1
  const weights = [3, 1, 1, 1]; // total weight = 6
  // Progress 0.25 * 6 = 1.5 -> falls in frame 0
  assert.equal(calculateFrameIndex(0.25, 4, weights), 0);
  // Progress 0.6 * 6 = 3.6 -> falls in frame 1 (weights: 3 + 1 = 4)
  assert.equal(calculateFrameIndex(0.6, 4, weights), 1);
});

test('calculateMaskPosition coordinates for 6x4 sprite sheet', () => {
  // Frame 0: top-left (col 0, row 0) -> (0%, 0%)
  const f0 = calculateMaskPosition(0, 6, 4);
  assert.deepEqual(f0, { xPercent: 0, yPercent: 0, col: 0, row: 0 });

  // Frame 5: top-right (col 5, row 0) -> (100%, 0%)
  const f5 = calculateMaskPosition(5, 6, 4);
  assert.deepEqual(f5, { xPercent: 100, yPercent: 0, col: 5, row: 0 });

  // Frame 6: second row, first column (col 0, row 1) -> (0%, 33.3333%)
  const f6 = calculateMaskPosition(6, 6, 4);
  assert.equal(f6.col, 0);
  assert.equal(f6.row, 1);
  assert.equal(f6.xPercent, 0);
  assert.ok(Math.abs(f6.yPercent - 33.3333) < 0.01);

  // Frame 23: bottom-right (col 5, row 3) -> (100%, 100%)
  const f23 = calculateMaskPosition(23, 6, 4);
  assert.deepEqual(f23, { xPercent: 100, yPercent: 100, col: 5, row: 3 });
});

test('calculateTokenEconomics calculates accurate enterprise savings', () => {
  // 50 Million tokens/month:
  // Frontier (GPT-4o/Claude 3.5 Opus class) @ $15/1M = $750/mo
  // Fine-tuned 8B/14B @ $1.20/1M = $60/mo
  // Monthly savings = $690/mo, Annual savings = $8,280/yr (92% savings)
  const result = calculateTokenEconomics(50, 15.0, 1.20);
  assert.equal(result.monthlySavings, 690);
  assert.equal(result.annualSavings, 8280);
  assert.equal(result.percentSaved, 92);
});
