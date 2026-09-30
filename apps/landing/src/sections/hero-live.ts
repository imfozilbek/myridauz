import type { HeroRoads } from '../map-data';

const LIGHT = { seconds: 3.2, step: 0.23, offset: 0.37 } as const;

// Lights that drive from Toshkent along every road of the still map picture, and a pulse at the
// start (docs/60). The drawing uses the box of the picture, so the roads lie exactly on it.
export function heroLive({ box, hub, routes }: HeroRoads) {
  const [x, y] = hub;
  const lights = routes
    .map((path, index) => {
      const timing = `dur="${(LIGHT.seconds + index * LIGHT.step).toFixed(2)}s" begin="${((index * LIGHT.offset) % LIGHT.seconds).toFixed(2)}s"`;
      return `<circle class="light" r="8"><animateMotion ${timing} repeatCount="indefinite" path="${path}"/></circle>`;
    })
    .join('');
  return `<svg class="hero-live" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" aria-hidden="true">
<circle class="pulse" cx="${x}" cy="${y}" r="16"/>${lights}
</svg>`;
}
