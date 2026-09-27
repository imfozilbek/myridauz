// Channel assets (docs/37): avatar "code | R" with region name, post image 1280 x 720.
import { text, markR, textCentered, layout, CAP } from './text.mjs';
import { C, svg } from './palette.mjs';
import { squircle, plate } from './brand.mjs';

export function channelAvatar(r) {
  return svg(640, 640, `<rect width="640" height="640" fill="${C.teal}"/>` + plate(r.code, { x: 36, y: 176, w: 568 }) +
    textCentered(r.title.toUpperCase(), { cx: 320, cy: 478, h: 50, fill: C.white, maxWidth: 470, spacing: 0.04 }));
}

const fit = (str, weight, maxW, maxSize) => Math.min(maxSize, maxSize * maxW / layout(str, { weight, size: maxSize }).width);

export function channelPost(r) {
  const big = fit(r.big, 800, 600, 118), subText = `${r.suffix} safarlar`, sub = fit(subText, 600, 600, 40), o = sub * 0.2;
  return svg(1280, 720, `<rect width="1280" height="720" fill="${C.teal}"/>` + squircle(110, 160, 400, C.white) +
    markR({ cx: 310, cy: 360, h: 248, fill: C.teal }) +
    text('Rida', { x: 590, y: 238, fill: C.mint, weight: 600, size: 44 }) +
    text(r.big, { x: 586, y: 250 + big, fill: C.white, size: big }) +
    text(subText, { x: 590, y: 310 + big + o, fill: C.mint, weight: 600, size: sub }) +
    `<rect x="590" y="${360 + big + o}" width="140" height="12" rx="6" fill="${C.amber}"/>` +
    text('Manzil sari', { x: 590, y: 430 + big + o, fill: C.white, weight: 600, size: 36 }));
}
