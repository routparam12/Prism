/**
 * Path generation and spectral color mappings for the Anthropic-style SVG Light Stage.
 * Decoupled pure logic for deterministic testing.
 */

export const ANTHROPIC_SPECTRUM_BANDS = [
  // Band 0: Crimson / Rose / Coral (Top of fan, matching image.png top plume)
  { name: 'rose', colorLight: '#E25C80', colorDark: '#FF5C8A', opacity: 0.88 },
  { name: 'coral', colorLight: '#E86A5E', colorDark: '#FF6B5B', opacity: 0.82 },
  { name: 'crimson', colorLight: '#D9436A', colorDark: '#FF4568', opacity: 0.80 },
  // Band 1: Orange / Amber / Gold
  { name: 'amber', colorLight: '#E58A3C', colorDark: '#FF9500', opacity: 0.82 },
  { name: 'gold', colorLight: '#DFAB35', colorDark: '#FFD60A', opacity: 0.85 },
  { name: 'ochre', colorLight: '#CCA038', colorDark: '#FFE043', opacity: 0.80 },
  // Band 2: Sage / Mineral Green (Anthropic iconic #A2B48B & rgb(137,157,112))
  { name: 'sage-light', colorLight: '#A2B48B', colorDark: '#5AD878', opacity: 0.88 },
  { name: 'sage-deep', colorLight: 'rgb(137,157,112)', colorDark: '#38C862', opacity: 0.84 },
  { name: 'mineral', colorLight: '#8FA876', colorDark: '#30D158', opacity: 0.80 },
  // Band 3: Sky Blue / Cyan (Anthropic iconic #6A9BCC & rgb(71,124,177))
  { name: 'sky', colorLight: '#6A9BCC', colorDark: '#32ADE6', opacity: 0.90 },
  { name: 'cyan-deep', colorLight: 'rgb(71,124,177)', colorDark: '#45B5F2', opacity: 0.86 },
  { name: 'cobalt', colorLight: '#5283B5', colorDark: '#0A84FF', opacity: 0.82 },
  // Band 4: Indigo / Violet / Soft Lavender (Bottom of fan)
  { name: 'indigo', colorLight: '#6E6BC2', colorDark: '#5E5CE6', opacity: 0.85 },
  { name: 'violet', colorLight: '#9960B8', colorDark: '#BF5AF2', opacity: 0.82 },
  { name: 'purple', colorLight: '#B065AC', colorDark: '#DA55E0', opacity: 0.78 }
];

/**
 * Calculates cubic bezier curve for a spectral ray strand with an initial
 * horizontal collimation section before organic fan flare, exactly matching
 * Anthropic's felt-marker line chart curvature in econ-scenarios.
 *
 * @param {number} startX
 * @param {number} startY
 * @param {number} endX
 * @param {number} endY
 * @param {number} [curvature=0.58]
 * @returns {{d: string, cp1: {x: number, y: number}, cp2: {x: number, y: number}}}
 */
export function generateRayPath(startX, startY, endX, endY, curvature = 0.58) {
  const dx = endX - startX;
  const dy = endY - startY;

  // Initial horizontal collimation: strands travel together horizontally exiting the prism
  const cp1 = {
    x: Math.round(startX + dx * 0.22),
    y: Math.round(startY + dy * 0.04)
  };

  // Organic fan inflection for the graceful S-curve plume
  const cp2 = {
    x: Math.round(startX + dx * curvature),
    y: Math.round(startY + dy * 0.72)
  };

  const d = `M ${startX} ${startY} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endX} ${endY}`;
  return { d, cp1, cp2 };
}

/**
 * Generates an array of spectral rays with distributed target endpoints,
 * stippled dash offsets, and color assignments.
 *
 * @param {number} count Total number of rays
 * @param {number} startX Exit point X
 * @param {number} startY Exit point Y
 * @param {number} endX Right stage edge X
 * @param {number} minY Top target Y
 * @param {number} maxY Bottom target Y
 * @returns {Array<any>}
 */
export function generateSpectralRayCollection(
  count = 32,
  startX = 330,
  startY = 220,
  endX = 1240,
  minY = 32,
  maxY = 408
) {
  const rays = [];
  const bandCount = ANTHROPIC_SPECTRUM_BANDS.length;

  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const endY = Math.round(minY + (maxY - minY) * t);

    // Map t proportionally to color bands
    const bandIdx = Math.min(Math.floor(t * bandCount), bandCount - 1);
    const band = ANTHROPIC_SPECTRUM_BANDS[bandIdx];

    // Varied dash and gap sizes matching felt-tip marker stippling in image.png
    const dashLength = 8 + (i % 4) * 3; // 8, 11, 14, 17
    const dashGap = 6 + ((i * 3) % 5);   // 6, 9, 7, 10, 8
    const strokeWidth = 2.0 + (i % 3) * 0.7; // 2.0px, 2.7px, 3.4px

    const { d } = generateRayPath(startX, startY, endX, endY);

    rays.push({
      id: `ray-${i}`,
      index: i,
      t,
      d,
      endY,
      colorLight: band.colorLight,
      colorDark: band.colorDark,
      opacity: band.opacity,
      strokeWidth,
      dashArray: `${dashLength} ${dashGap}`,
      speed: 0.85 + ((i * 7) % 5) * 0.12 // slight variation in flow velocity
    });
  }

  return rays;
}

/**
 * Generates incoming multi-strand beam configuration entering from left edge to the prism facet.
 * @param {number} startX
 * @param {number} endX
 * @param {number} centerY
 */
export function generateIncomingBeamData(startX = -20, endX = 244, centerY = 220) {
  const strandOffsets = [-4, -2, 0, 2, 4];
  return strandOffsets.map((offset, idx) => {
    const y = centerY + offset;
    return {
      id: `incoming-${idx}`,
      x1: startX,
      y1: y,
      x2: endX,
      y2: y,
      strokeWidth: idx === 2 ? 3.0 : 1.8,
      dashArray: idx % 2 === 0 ? '16 8' : '12 6',
      colorLight: idx === 2 ? '#6B655D' : '#9E978C',
      colorDark: idx === 2 ? '#FFFFFF' : '#E8E6DF',
      opacity: idx === 2 ? 0.88 : 0.72,
      speed: 0.95 + idx * 0.05
    };
  });
}
