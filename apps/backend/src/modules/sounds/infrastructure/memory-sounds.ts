import type { SoundPick, SoundRepository } from '../application/ports';

// The same table as migrations/0038_sound_choices.sql, in memory for tests and local runs.
export function createMemorySounds(): SoundRepository {
  const picks: SoundPick[] = [];
  return {
    latest: async () => picks.at(-1) ?? null,
    add: async (set, changedBy, changedAt) => void picks.push({ set, changedBy, changedAt }),
  };
}
