import { describe, expect, it } from 'vitest';
import { SIZE, colorize, frameOf, stroke } from './drawing.mjs';

describe('region drawings (G59, docs/118)', () => {
  it('a square photo: the frame has the drawing shape and stops above the ✦ mark', () => {
    const frame = frameOf(480, 480);
    expect(frame.width / frame.height).toBeCloseTo(SIZE.width / SIZE.height, 1);
    expect(frame.top + frame.height).toBeLessThanOrEqual(Math.floor(480 * 0.83));
  });

  it('a low photo: the frame narrows instead of reaching the mark', () => {
    const frame = frameOf(480, 320);
    expect(frame.top).toBe(0);
    expect(frame.height).toBe(Math.floor(320 * 0.83));
    expect(Math.abs(frame.left + frame.width / 2 - 240)).toBeLessThanOrEqual(1);
  });

  it('flat gray is paper, an edge darker than its blur is a line', () => {
    expect(stroke(200, 55)).toBe(0);
    expect(stroke(60, 55)).toBeGreaterThan(0.5);
    expect(stroke(0, 255)).toBe(0);
  });

  it('paper keeps the paper color, a full line the line color', () => {
    const out = colorize(Buffer.from([200, 0]), Buffer.from([55, 200]), '#F0FDFA', '#0D9488');
    expect([...out]).toEqual([0xf0, 0xfd, 0xfa, 0x0d, 0x94, 0x88]);
  });
});
