import type { LookRow, LookStore } from '../application/looks';

type Row = { face: string; checked_at: number; picture_hash: string | null; photo_id: string | null };

const SAVE = `INSERT OR REPLACE INTO looks (face, checked_at, picture_hash, photo_id) VALUES (?1, ?2, ?3, ?4)`;

// Table looks (migration 0066): one row a bot or a channel, under a hundred rows.
export const d1Looks = (db: D1Database): LookStore => ({
  rows: async () =>
    (await db.prepare('SELECT * FROM looks').all<Row>()).results.map((row) => ({
      key: row.face,
      checkedAt: row.checked_at,
      memory: row.picture_hash && row.photo_id ? { hash: row.picture_hash, photo: row.photo_id } : null,
    })),
  save: async ({ key, checkedAt, memory }) => {
    await db
      .prepare(SAVE)
      .bind(key, checkedAt, memory?.hash ?? null, memory?.photo ?? null)
      .run();
  },
});

// Tests and local runs: the same rows in memory.
export function createMemoryLooks(): LookStore {
  const rows = new Map<string, LookRow>();
  return {
    rows: async () => [...rows.values()],
    save: async (row) => void rows.set(row.key, row),
  };
}
