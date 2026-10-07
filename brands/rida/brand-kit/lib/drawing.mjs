// A region photo becomes a line drawing in the color of an app (docs/118): a pencil sketch
// (the gray picture divided by its own blurred negative) laid over a light paper of the same color.
// Pure pixel math: the script region-drawings.mjs reads and writes the files.

// The photos carry a ✦ mark low in the right corner: the frame stops above it. Every drawing has
// one size, so cards of one kind are one size (docs/121).
export const SIZE = { width: 480, height: 314 };
const MARK_SHARE = 0.17;

// The widest part of the photo above the mark with the shape of SIZE, as low as possible.
export function frameOf(width, height) {
  const free = Math.floor(height * (1 - MARK_SHARE));
  const shape = SIZE.width / SIZE.height;
  const frameHeight = Math.min(free, Math.round(width / shape));
  const frameWidth = Math.min(width, Math.round(frameHeight * shape));
  return { left: Math.floor((width - frameWidth) / 2), top: free - frameHeight, width: frameWidth, height: frameHeight };
}
export const BLUR_SIGMA = 6;
// Faint strokes fade into the paper, strong ones keep their color: the drawing stays light.
const STROKE_GAMMA = 0.7;
const STROKE_GAIN = 1.35;
const MAX = 255;

const rgb = (hex) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

// How dark the pencil is at one pixel: 0 is paper, 1 is a full line.
export function stroke(gray, blurredNegative) {
  const dodged = blurredNegative >= MAX ? MAX : Math.min(MAX, (gray * MAX) / (MAX - blurredNegative));
  const dark = 1 - dodged / MAX;
  return Math.min(1, STROKE_GAIN * dark ** STROKE_GAMMA);
}

// The colored drawing: every pixel mixes the paper and the line color by its stroke.
export function colorize(gray, blurredNegative, paper, line) {
  const [paperColor, lineColor] = [rgb(paper), rgb(line)];
  const out = Buffer.alloc(gray.length * 3);
  for (let i = 0; i < gray.length; i += 1) {
    const amount = stroke(gray[i], blurredNegative[i]);
    for (let channel = 0; channel < 3; channel += 1)
      out[i * 3 + channel] = Math.round(paperColor[channel] + (lineColor[channel] - paperColor[channel]) * amount);
  }
  return out;
}
