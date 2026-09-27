// Music map of "Achilles" (Kevin MacLeod, CC BY 4.0, 60.94 s) and the order of scenes (docs/41).
// Soft intro to 12.8 s, build to 27.2 s, full power to 50.3 s, then a quiet fade.
// Each scene keeps its own timing; `speed` fits it into its part of the music.
import { C, svg } from '../lib/palette.mjs';
import { W, H, wipe, SOFT } from './kit.mjs';
import { VIGNETTE } from './world.mjs';
import { hook } from './scenes/hook.mjs';
import { reveal } from './scenes/reveal.mjs';
import { concept } from './scenes/concept.mjs';
import { passenger } from './scenes/passenger.mjs';
import { driver } from './scenes/driver.mjs';
import { trust } from './scenes/trust.mjs';
import { uzMap } from './scenes/map.mjs';
import { telegram } from './scenes/telegram.mjs';
import { pause, finale, end } from './scenes/finale.mjs';

export const DURATION = 60.94, FPS = 30;

// [start second, scene, speed]: the scene gets local time (t - start) × speed.
const SECTIONS = [
  [0, hook, 1.064], [7.96, reveal, 1.66], [12.77, concept, 1.6], [17.77, passenger, 1.7], [27.19, driver, 1.98],
  [37.3, trust, 2.22], [44.5, uzMap, 2.4], [49.5, telegram, 2.5], [51.2, pause, 1.77], [52.7, finale, 1.45], [58.3, end, 1]
];
// Circle wipes into the next scene's background.
const WIPES = [
  [7.96, C.teal], [12.77, C.white], [27.19, C.amber], [27.19 + 4 / 1.98, SOFT], [27.19 + 16 / 1.98, C.white],
  [37.3, C.white], [49.5, SOFT], [51.2, C.white], [52.7, C.teal]
];

export function frame(t) {
  const i = SECTIONS.findLastIndex(([from]) => t >= from);
  const [from, scene, speed] = SECTIONS[i], to = SECTIONS[i + 1]?.[0] ?? DURATION;
  return svg(W, H, scene((t - from) * speed, (to - from) * speed) + VIGNETTE + WIPES.map(([at, fill]) => wipe(t, at, fill)).join(''));
}
