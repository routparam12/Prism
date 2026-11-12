import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRayPath,
  generateSpectralRayCollection,
  ANTHROPIC_SPECTRUM_BANDS
} from '../js/anthropic-stage-paths.js';

test('generateRayPath produces valid cubic bezier path starting at prism exit', () => {
  const { d, cp1, cp2 } = generateRayPath(418, 205, 1220, 50);
  assert.ok(d.startsWith('M 418 205 C'), 'Path starts with M 418 205 C');
  assert.ok(d.endsWith('1220 50'), 'Path ends at target 1220 50');
  assert.ok(cp1.x > 418 && cp1.x < cp2.x, 'Control points progress horizontally');
  assert.ok(cp2.x < 1220, 'Control point 2 is before endX');
});

test('generateSpectralRayCollection creates specified count and spans full target range', () => {
  const count = 30;
  const rays = generateSpectralRayCollection(count, 418, 205, 1220, 35, 395);
  assert.equal(rays.length, count);
  
  // First ray should target top (minY = 35)
  assert.equal(rays[0].endY, 35);
  // Last ray should target bottom (maxY = 395)
  assert.equal(rays[count - 1].endY, 395);

  // Check color band mapping
  assert.ok(rays[0].colorLight.includes('E25C80') || rays[0].colorLight.includes('E86A5E'), 'Top ray is rose/coral');
  assert.ok(rays[count - 1].colorLight.includes('6E6BC2') || rays[count - 1].colorLight.includes('B065AC'), 'Bottom ray is indigo/violet');

  // Verify dash patterns exist for stippled marker feel
  rays.forEach(r => {
    assert.ok(r.dashArray.includes(' '), 'Each ray has a valid dashArray for stippling');
    assert.ok(r.strokeWidth >= 2.0 && r.strokeWidth <= 4.0, 'Stroke width is calibrated for felt marker stroke');
  });
});
