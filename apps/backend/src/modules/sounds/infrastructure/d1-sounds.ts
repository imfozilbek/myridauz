import type { SoundRepository } from '../application/ports';

type PickRow = { sound_set: string; changed_by: number; changed_at: number };

// Table sound_choices (migrations/0038_sound_choices.sql).
export const d1Sounds = (db: D1Database): SoundRepository => ({
  latest: async () => {
    const row = await db
      .prepare('SELECT sound_set, changed_by, changed_at FROM sound_choices ORDER BY version DESC LIMIT 1')
      .first<PickRow>();
    return row ? { set: row.sound_set, changedBy: row.changed_by, changedAt: row.changed_at } : null;
  },
  add: async (set, changedBy, at) => {
    await db
      .prepare('INSERT INTO sound_choices (sound_set, changed_by, changed_at) VALUES (?, ?, ?)')
      .bind(set, changedBy, at)
      .run();
  },
});
