// Easing for animated frames: t is time in seconds, p is progress 0..1.
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const outCubic = (p) => 1 - Math.pow(1 - p, 3);
// Back-out with overshoot 1.7 (token ease.pop): tiles, dots, buttons.
export const outBack = (p) => (p <= 0 ? 0 : 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2));
export const scaleAt = (cx, cy, s) => `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;
