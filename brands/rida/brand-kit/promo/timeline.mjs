// Music map of "Breakthrough" (ArcticFoxMusic, 112.56 s) and the order of scenes (docs/41).
// Phrases last 8 s from 0.47 s; quiet drops at 7.0, 43.0 and 92.8 s; fade-out after 105 s.
import { C, svg } from '../lib/palette.mjs';
import { W, H, wipe, SOFT } from './kit.mjs';
import { hook } from './scenes/hook.mjs';
import { reveal } from './scenes/reveal.mjs';
import { concept } from './scenes/concept.mjs';
import { passenger } from './scenes/passenger.mjs';
import { driver } from './scenes/driver.mjs';
import { trust } from './scenes/trust.mjs';
import { uzMap } from './scenes/map.mjs';
import { telegram } from './scenes/telegram.mjs';
import { pause, finale, end } from './scenes/finale.mjs';

export const DURATION = 112.56, FPS = 30;

// [start second, scene]: each scene gets its local time and length.
const SECTIONS = [
  [0, hook], [8.47, reveal], [16.47, concept], [24.47, passenger], [40.47, driver], [60.47, trust],
  [76.47, uzMap], [88.47, telegram], [92.75, pause], [95.4, finale], [105, end]
];
// Circle wipes into the next scene's background.
const WIPES = [
  [8.47, C.teal], [16.47, C.white], [40.47, C.amber], [44.47, SOFT], [56.47, C.white],
  [76.47, C.white], [88.47, SOFT], [92.75, C.white], [95.4, C.teal]
];

export function frame(t) {
  const i = SECTIONS.findLastIndex(([from]) => t >= from);
  const [from, scene] = SECTIONS[i], to = SECTIONS[i + 1]?.[0] ?? DURATION;
  return svg(W, H, scene(t - from, to - from) + WIPES.map(([at, fill]) => wipe(t, at, fill)).join(''));
}
