import { attentionSignSchema, DAY_MS, tashkentDate } from '@platform/contracts';
import type { KeptSign, SignStore } from '../application/attention';

type Row = { id: string; sign: string; at: number };

const KEEP = 'INSERT OR REPLACE INTO attention_signs (day, id, sign, at) VALUES (?1, ?2, ?3, ?4)';
// Through the primary key (day, id): the days past a week are forgotten (docs/117).
const FORGET_OLD = 'DELETE FROM attention_signs WHERE day < ?1';
const OF_DAY = 'SELECT id, sign, at FROM attention_signs WHERE day = ?1 ORDER BY at DESC, rowid DESC';
const KEEP_DAYS = 7;

// A row that no longer reads as a sign (an old kind) is skipped, never shown broken.
const signOf = (row: Row): KeptSign[] => {
  const sign = attentionSignSchema.safeParse(JSON.parse(row.sign));
  return sign.success ? [{ id: row.id, at: row.at, sign: sign.data }] : [];
};

// Table attention_signs (migration 0055).
export const d1Signs = (db: D1Database): SignStore => ({
  keep: async (day, { id, at, sign }) => {
    await db.batch([
      db.prepare(KEEP).bind(day, id, JSON.stringify(sign), at),
      db.prepare(FORGET_OLD).bind(tashkentDate(at - KEEP_DAYS * DAY_MS)),
    ]);
  },
  ofDay: async (day) => (await db.prepare(OF_DAY).bind(day).all<Row>()).results.flatMap(signOf),
});

// Tests and local runs: the same rules in memory.
export function createMemorySigns(): SignStore {
  const days = new Map<string, Map<string, KeptSign>>();
  return {
    keep: async (day, kept) => {
      const signs = days.get(day) ?? new Map<string, KeptSign>();
      signs.delete(kept.id);
      days.set(day, signs.set(kept.id, kept));
    },
    ofDay: async (day) => [...(days.get(day)?.values() ?? [])].reverse(),
  };
}
