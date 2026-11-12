/**
 * Prism Sprite Sheet Generator
 * Generates a 6x4 (24 frames) high-resolution 1536x1024 WebP sprite sheet.
 * Single-color silhouette/mask for CSS mask-image animation.
 * Frame 0 is a clean, static, balanced mark.
 * Frames 1-23 animate a faceted prism with hand-drawn edge jitter,
 * incoming light beam, and 3 dispersing spectrum rays that fan out and settle.
 */

import fs from 'node:fs';
import path from 'node:path';

export function createDrawingScript() {
  return `
(() => {
  const COLS = 6;
  const ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_W = 256;
  const FRAME_H = 256;
  const SHEET_W = COLS * FRAME_W;
  const SHEET_H = ROWS * FRAME_H;

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SHEET_W, SHEET_H);

  // Deterministic pseudo-random seed per frame for natural organic hand-drawn jitter
  function pseudoNoise(seed, scale = 1) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return (x - Math.floor(x) - 0.5) * 2 * scale;
  }

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const col = f % COLS;
    const row = Math.floor(f / COLS);
    const ox = col * FRAME_W;
    const oy = row * FRAME_H;

    ctx.save();
    ctx.translate(ox, oy);

    // Frame 0 is perfectly crisp and clean
    const isRest = (f === 0);
    const progress = f / (TOTAL_FRAMES - 1); // 0 to 1

    // Hand-drawn jitter intensity (peaks in middle, 0 at rest)
    const jitter = isRest ? 0 : Math.sin(progress * Math.PI) * 2.2;
    const pulse = isRest ? 0 : Math.sin(progress * Math.PI * 2);

    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Prism geometry center: (112, 128)
    const cx = 112;
    const cy = 128;
    const size = 52;

    // Triangle vertices with organic hand-drawn wobble
    const topX = cx + (isRest ? 0 : pseudoNoise(f * 1.7, jitter));
    const topY = (cy - size) + (isRest ? 0 : pseudoNoise(f * 2.3, jitter));

    const leftX = (cx - size * 0.9) + (isRest ? 0 : pseudoNoise(f * 3.1, jitter));
    const leftY = (cy + size * 0.85) + (isRest ? 0 : pseudoNoise(f * 4.2, jitter));

    const rightX = (cx + size * 0.9) + (isRest ? 0 : pseudoNoise(f * 5.3, jitter));
    const rightY = (cy + size * 0.85) + (isRest ? 0 : pseudoNoise(f * 6.4, jitter));

    // Internal facet center
    const facetX = cx + (isRest ? 0 : pseudoNoise(f * 7.5, jitter * 0.8));
    const facetY = (cy + size * 0.15) + (isRest ? 0 : pseudoNoise(f * 8.6, jitter * 0.8));

    // Outer triangular prism frame
    ctx.lineWidth = isRest ? 7 : (6.5 + pseudoNoise(f * 9.1, 0.8));
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.stroke();

    // Internal facets creating 3D refractive prism planes
    ctx.lineWidth = isRest ? 4 : (3.8 + pseudoNoise(f * 10.2, 0.6));
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(facetX, facetY);
    ctx.lineTo(leftX, leftY);
    ctx.moveTo(facetX, facetY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();

    // Subtle shaded inner facet (left face) for geometric dimension
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(facetX, facetY);
    ctx.lineTo(leftX, leftY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Incoming light beam from left
    const beamStartX = 28;
    const beamStartY = 138 + (isRest ? 0 : Math.sin(progress * Math.PI) * 4);
    const beamHitX = (leftX + facetX) / 2 + 4;
    const beamHitY = (leftY + facetY) / 2 - 2;

    ctx.lineWidth = isRest ? 6 : (5.5 + Math.sin(f * 0.8) * 1.5);
    ctx.beginPath();
    ctx.moveTo(beamStartX, beamStartY);
    // Draw incoming beam with slight hand-drawn segment
    const midBeamX = (beamStartX + beamHitX) / 2;
    const midBeamY = (beamStartY + beamHitY) / 2 + (isRest ? 0 : pseudoNoise(f * 11, jitter * 0.6));
    ctx.quadraticCurveTo(midBeamX, midBeamY, beamHitX, beamHitY);
    ctx.stroke();

    // Small refraction core sparkle inside prism
    if (!isRest && f > 2 && f < 22) {
      const sparkleSize = 3 + Math.abs(pulse) * 3;
      ctx.beginPath();
      ctx.arc(facetX, facetY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3 Dispersed spectrum rays exiting right face
    // Ray 1: Upper Violet/Blue ray
    // Ray 2: Middle Green ray
    // Ray 3: Lower Red/Amber ray
    const exitBaseX = (rightX + topX) / 2;
    const exitBaseY = (rightY + topY) / 2 + 10;

    // Dispersal angles and lengths fan out during animation
    const fanSpread = isRest ? 1.0 : (1.0 + Math.sin(progress * Math.PI) * 0.45);
    const rayLength = isRest ? 68 : (65 + Math.sin(progress * Math.PI) * 12);

    const rays = [
      { angle: -0.38 * fanSpread, width: 4.8, len: rayLength * 1.05 }, // Top ray
      { angle: -0.04,            width: 5.5, len: rayLength * 1.15 }, // Middle ray
      { angle: 0.32 * fanSpread,  width: 5.0, len: rayLength * 0.95 }  // Bottom ray
    ];

    rays.forEach((ray, i) => {
      const angleJitter = isRest ? 0 : pseudoNoise(f * 13 + i * 7, 0.04);
      const effAngle = ray.angle + angleJitter;
      const targetX = exitBaseX + Math.cos(effAngle) * ray.len;
      const targetY = exitBaseY + Math.sin(effAngle) * ray.len;

      ctx.lineWidth = isRest ? ray.width : (ray.width + pseudoNoise(f * 14 + i, 0.8));
      ctx.beginPath();
      ctx.moveTo(exitBaseX, exitBaseY);
      
      const ctrlX = exitBaseX + Math.cos(effAngle) * (ray.len * 0.5);
      const ctrlY = exitBaseY + Math.sin(effAngle) * (ray.len * 0.5) + (isRest ? 0 : pseudoNoise(f * 15 + i, jitter * 1.2));
      ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
      ctx.stroke();

      // Delicate accent terminal dot at ray ends
      ctx.beginPath();
      const dotR = (ray.width * 0.55) + (isRest ? 0 : Math.sin(f + i) * 0.8);
      ctx.arc(targetX, targetY, Math.max(2, dotR), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  return canvas.toDataURL('image/webp', 0.95);
})();
`;
}
