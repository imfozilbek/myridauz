import type { SoundChoice, SoundsState } from '@platform/contracts';
import type { SoundsDeps } from './ports';

// The set that plays: the last pick of the owner while the brand still has it, else the default.
async function current(deps: SoundsDeps) {
  const pick = await deps.sounds.latest();
  return pick && deps.sets.includes(pick.set) ? pick : null;
}

export async function publicSounds(deps: SoundsDeps): Promise<SoundChoice> {
  return { set: (await current(deps))?.set ?? deps.defaultSet };
}

// The admin screen of the owner: the set in use and the others to listen to (docs/02, G75).
export async function soundsState(deps: SoundsDeps): Promise<SoundsState> {
  const pick = await current(deps);
  return {
    set: pick?.set ?? deps.defaultSet,
    sets: [...deps.sets],
    changedBy: pick?.changedBy ?? null,
    changedAt: pick?.changedAt ?? null,
  };
}

// A set the brand does not have is refused: the Mini Apps would have no file to play.
export async function pickSounds(deps: SoundsDeps, set: string, by: number): Promise<SoundsState | null> {
  if (!deps.sets.includes(set)) return null;
  await deps.sounds.add(set, by, deps.now());
  return soundsState(deps);
}
