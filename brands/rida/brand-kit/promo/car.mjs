// Side view of a car with people in the windows; wheels turn with time. y is the road line.
import { C } from '../lib/palette.mjs';

const HEADS = [C.amber, C.white, C.mint, C.amberLight];

function wheel(cx, cy, t, spin) {
  const a = (t * spin) % 360;
  return `<circle cx="${cx}" cy="${cy}" r="34" fill="${C.ink}"/><circle cx="${cx}" cy="${cy}" r="14" fill="${C.line}"/>` +
    `<g transform="rotate(${a.toFixed(1)} ${cx} ${cy})"><rect x="${cx - 2}" y="${cy - 26}" width="4" height="52" fill="${C.grey}"/>` +
    `<rect x="${cx - 26}" y="${cy - 2}" width="52" height="4" fill="${C.grey}"/></g>`;
}

// people: how many heads show in the windows (0 … 4). bob: small bounce while driving.
export function car(x, y, t, { scale = 1, flip = false, people = 4, spin = 720, body = C.teal, bob = true } = {}) {
  const b = bob ? Math.sin(t * 14) * 2 : 0, top = y - 40 + b;
  const heads = HEADS.slice(0, people).map((fill, i) => {
    const hx = x - 60 + i * 44;
    return `<circle cx="${hx}" cy="${top - 108}" r="15" fill="${fill}"/><rect x="${hx - 14}" y="${top - 94}" width="28" height="20" rx="10" fill="${fill}"/>`;
  }).join('');
  const shape = `<path d="M${x - 95} ${top - 80}L${x - 62} ${top - 150}L${x + 58} ${top - 150}L${x + 108} ${top - 80}Z" fill="${body}"/>` +
    `<path d="M${x - 78} ${top - 86}L${x - 54} ${top - 138}L${x + 50} ${top - 138}L${x + 90} ${top - 86}Z" fill="${C.mint}"/>` + heads +
    `<rect x="${x - 150}" y="${top - 90}" width="300" height="90" rx="34" fill="${body}"/>` +
    `<circle cx="${x + 134}" cy="${top - 56}" r="9" fill="${C.amber}"/>` + wheel(x - 88, y - 34, t, spin) + wheel(x + 88, y - 34, t, spin);
  const f = flip ? `translate(${2 * x} 0) scale(-1 1)` : '';
  return `<g transform="${f} translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})">${shape}</g>`;
}
