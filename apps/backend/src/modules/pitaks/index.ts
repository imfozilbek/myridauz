import type { Bindings } from '../../env';
import { isRegionId, regionOf } from '../map';
import { pitakOfDirection, pitakView } from './application/pitaks';
import type { PitaksDeps } from './application/ports';
import { pitakRoutes } from './http/pitak-routes';
import { d1Pitaks } from './infrastructure/d1-pitaks';
import { createMemoryPitaks } from './infrastructure/memory-pitaks';

// Without D1 (tests) the pitaks live in memory.
const localPitaks = createMemoryPitaks();

const pitaksDeps = (env: Bindings): PitaksDeps => ({
  store: env.DB ? d1Pitaks(env.DB) : localPitaks,
  regionOf,
  isRegion: isRegionId,
  now: () => Date.now(),
  newId: () => crypto.randomUUID(),
});

// The pitaks (G24, docs/72): the admin of the team and the pitak of a direction for the trips.
export const pitaksModule = pitakRoutes(pitaksDeps);
export const pitakOf = (env: Bindings, from: string, to: string) =>
  pitakOfDirection(pitaksDeps(env), from, to);
// The pitak a booking fixed (docs/70): shown even if the team closed it later.
export const pitakById = async (env: Bindings, id: string) => {
  const pitak = await pitaksDeps(env).store.find(id);
  return pitak ? pitakView(pitak) : null;
};
