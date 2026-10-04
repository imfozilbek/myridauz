import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import type { SoundsDeps } from './application/ports';
import { soundsRoutes } from './http/sounds-routes';
import { d1Sounds } from './infrastructure/d1-sounds';
import { createMemorySounds } from './infrastructure/memory-sounds';

// Without D1 (tests) the picks live in memory.
const localSounds = createMemorySounds();

const soundsDeps = (env: Bindings): SoundsDeps => {
  const { sounds } = loadBrand(env.BRAND);
  return {
    sounds: env.DB ? d1Sounds(env.DB) : localSounds,
    sets: sounds.sets,
    defaultSet: sounds.defaultSet,
    now: Date.now,
  };
};

export const soundsModule = soundsRoutes(soundsDeps);
