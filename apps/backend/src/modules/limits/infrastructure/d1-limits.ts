import { LIMIT_KEYS, type LimitKey } from '@platform/contracts';
import type { LimitChange, LimitStore } from '../application/ports';

type ValueRow = { key: string; value: number };
type ChangeRow = { key: string; before: number; after: number; changed_by: number; changed_at: number };

const isKey = (key: string): key is LimitKey => (LIMIT_KEYS as readonly string[]).includes(key);
const SET =
  'INSERT OR REPLACE INTO limit_values (key, value, changed_by, changed_at) VALUES (?1, ?2, ?3, ?4)';
const LOG =
  'INSERT INTO limit_history (key, before, after, changed_by, changed_at) VALUES (?1, ?2, ?3, ?4, ?5)';
// Through the index limit_history_at (docs/117).
const HISTORY = 'SELECT * FROM limit_history ORDER BY changed_at DESC LIMIT ?1';

// Tables limit_values and limit_history (migration 0058); a key the code no longer has is skipped.
export const d1Limits = (db: D1Database): LimitStore => ({
  values: async () => {
    const { results } = await db.prepare('SELECT key, value FROM limit_values').all<ValueRow>();
    return new Map(results.flatMap((row) => (isKey(row.key) ? [[row.key, row.value] as const] : [])));
  },
  change: async ({ key, before, after, by, at }) => {
    await db.batch([
      db.prepare(SET).bind(key, after, by, at),
      db.prepare(LOG).bind(key, before, after, by, at),
    ]);
  },
  history: async (limit) =>
    (await db.prepare(HISTORY).bind(limit).all<ChangeRow>()).results.flatMap((row) =>
      isKey(row.key)
        ? [{ key: row.key, before: row.before, after: row.after, by: row.changed_by, at: row.changed_at }]
        : [],
    ),
});

// Tests and local runs: the same rules in memory.
export function createMemoryLimits(): LimitStore {
  const values = new Map<LimitKey, number>();
  const changes: LimitChange[] = [];
  return {
    values: async () => new Map(values),
    change: async (change) => {
      values.set(change.key, change.after);
      changes.unshift(change);
    },
    history: async (limit) => changes.slice(0, limit),
  };
}
