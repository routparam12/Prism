import test from 'node:test';
import assert from 'node:assert/strict';
import {
  interpolateSpectrum,
  calculateFanBounds,
  calculateEntranceProgress,
  calculateStreakDistribution,
  SPECTRUM_COLORS
} from '../js/light-stage-math.js';

test('interpolateSpectrum boundaries and color ordering', () => {
  const red = interpolateSpectrum(0.0);
  assert.equal(Math.round(red.r * 255), 255);
  assert.equal(Math.round(red.g * 255), 59);
  assert.equal(Math.round(red.b * 255), 48);

  const violet = interpolateSpectrum(1.0);
  assert.equal(Math.round(violet.r * 255), 175);
  assert.equal(Math.round(violet.g * 255), 82);
  assert.equal(Math.round(violet.b * 255), 222);

  // Mid-point should be around green/cyan
  const mid = interpolateSpectrum(0.5);
  assert.ok(mid.g > mid.r, 'Mid-spectrum is green-dominant');
});

test('calculateFanBounds respects 15% pulse widening', () => {
  const baseCenter = 0.08;
  const baseSpread = 0.40; // ~23 degrees

  const idle = calculateFanBounds(baseCenter, baseSpread, 0);
  assert.equal(idle.spread, baseSpread);
  assert.equal(idle.minAngle, baseCenter - baseSpread * 0.5);
  assert.equal(idle.maxAngle, baseCenter + baseSpread * 0.5);

  const pulsed = calculateFanBounds(baseCenter, baseSpread, 1.0);
  assert.ok(Math.abs(pulsed.spread - baseSpread * 1.15) < 1e-6, 'Pulsed spread expands by 15%');
  assert.ok(pulsed.maxAngle > idle.maxAngle);
  assert.ok(pulsed.minAngle < idle.minAngle);
});

test('calculateEntranceProgress two-stage timing', () => {
  const t0 = calculateEntranceProgress(0, 1600);
  assert.equal(t0.overall, 0);
  assert.equal(t0.beamProgress, 0);
  assert.equal(t0.spectrumProgress, 0);

  // At 700ms, beam has completed, spectrum is just starting
  const t700 = calculateEntranceProgress(700, 1600);
  assert.equal(t700.beamProgress, 1.0);
  assert.equal(t700.spectrumProgress, 0);

  // At 1600ms, both are complete
  const tEnd = calculateEntranceProgress(1600, 1600);
  assert.equal(tEnd.overall, 1.0);
  assert.equal(tEnd.beamProgress, 1.0);
  assert.equal(tEnd.spectrumProgress, 1.0);
});

test('calculateStreakDistribution produces non-flat hairline peaks', () => {
  const s1 = calculateStreakDistribution(0.1, 72, 0.5);
  const s2 = calculateStreakDistribution(0.12, 72, 0.5);
  const s3 = calculateStreakDistribution(0.15, 72, 0.5);

  assert.ok(typeof s1 === 'number' && s1 >= 0);
  assert.ok(typeof s2 === 'number' && s2 >= 0);
  assert.notEqual(s1, s2, 'Streak intensity varies sharply across angles (not a flat wedge)');
});
