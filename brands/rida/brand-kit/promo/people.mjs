// A crowd of little people: bursts over the frame, then gathers into the letter R.
import { C } from '../lib/palette.mjs';
import { glyphPath } from '../lib/text.mjs';
import { prog, outCubic } from '../lib/ease.mjs';
import { W, CX } from './kit.mjs';

const STEP = 46, SIZE = 30;
const COLORS = [C.white, C.mint, C.amber, C.white, C.amberLight];

// Grid points inside the glyph "R" (even-odd fill), centered on (cx, cy), cap height about h.
function targets(cx, cy, h) {
  const path = glyphPath('R', h / 0.7), bb = path.getBoundingBox(), polys = [];
  let cur = [], last = [0, 0];
  for (const c of path.commands) {
    if (c.type === 'M') { if (cur.length) polys.push(cur); cur = [[c.x, c.y]]; } else if (c.type === 'L') cur.push([c.x, c.y]);
    else if (c.type === 'Q' || c.type === 'C') {
      for (let i = 1; i <= 8; i++) {
        const u = i / 8, v = 1 - u;
        cur.push(c.type === 'Q' ? [v * v * last[0] + 2 * v * u * c.x1 + u * u * c.x, v * v * last[1] + 2 * v * u * c.y1 + u * u * c.y]
          : [v ** 3 * last[0] + 3 * v * v * u * c.x1 + 3 * v * u * u * c.x2 + u ** 3 * c.x, v ** 3 * last[1] + 3 * v * v * u * c.y1 + 3 * v * u * u * c.y2 + u ** 3 * c.y]);
      }
    }
    if (c.type !== 'Z') last = [c.x, c.y];
  }
  if (cur.length) polys.push(cur);
  const inside = (x, y) => polys.reduce((acc, p) => {
    let hit = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) hit = !hit;
    }
    return hit ? !acc : acc;
  }, false);
  const pts = [], dx = cx - (bb.x1 + bb.x2) / 2, dy = cy - (bb.y1 + bb.y2) / 2;
  for (let y = bb.y1 + STEP / 2; y < bb.y2; y += STEP) for (let x = bb.x1 + STEP / 2; x < bb.x2; x += STEP) if (inside(x, y)) pts.push([x + dx, y + dy]);
  return pts;
}

const person = (x, y, color) => `<circle cx="${x.toFixed(1)}" cy="${(y - SIZE * 0.42).toFixed(1)}" r="${SIZE * 0.26}" fill="${color}"/>` +
  `<path d="M${(x - SIZE * 0.42).toFixed(1)} ${(y + SIZE * 0.42).toFixed(1)}a${SIZE * 0.42} ${SIZE * 0.5} 0 0 1 ${SIZE * 0.84} 0Z" fill="${color}"/>`;

let cache;
// burst: people fly out from the center; gather: they walk into the R (1.4 s).
export function crowd(t, { burst, gather, cx = CX, cy = 960, h = 760 }) {
  cache ??= targets(cx, cy, h);
  if (t < burst) return '';
  return cache.map(([tx, ty], i) => {
    const sx = (i * 173 + 61) % (W - 80) + 40, sy = 600 + ((i * 97 + 13) % 1000);
    const b = outCubic(prog(t, burst + (i % 7) * 0.03, burst + 0.7 + (i % 7) * 0.03));
    const gp = prog(t, gather + (i % 11) * 0.04, gather + 1.2 + (i % 11) * 0.04), e = gp * gp * (3 - 2 * gp);
    const wx = sx + Math.sin(t * 1.3 + i) * 10 * (1 - e), wy = sy + Math.cos(t * 1.1 + i * 0.7) * 8 * (1 - e);
    const x = cx + (wx - cx) * b + (tx - wx) * e, y = cy + (wy - cy) * b + (ty - wy) * e;
    return person(x, y, COLORS[i % COLORS.length]);
  }).join('');
}
