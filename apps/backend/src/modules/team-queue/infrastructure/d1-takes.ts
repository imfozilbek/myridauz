import { DAY_MS, NAVBAT_KINDS, type NavbatKind } from '@platform/contracts';
import type { Take, TakeStore } from '../application/takes';

type Row = { kind: string; case_id: string; member_id: number };

const TAKE = 'INSERT OR REPLACE INTO case_takes (kind, case_id, member_id, at) VALUES (?1, ?2, ?3, ?4)';
// Through the index case_takes_at (docs/117).
const FORGET_OLD = 'DELETE FROM case_takes WHERE at < ?1';
const FRESH = 'SELECT kind, case_id, member_id FROM case_takes WHERE at >= ?1 ORDER BY at';

const isKind = (kind: string): kind is NavbatKind => (NAVBAT_KINDS as readonly string[]).includes(kind);
const takeOf = (row: Row): Take[] =>
  isKind(row.kind) ? [{ kind: row.kind, id: row.case_id, memberId: row.member_id }] : [];

// Table case_takes (migration 0056).
export const d1Takes = (db: D1Database): TakeStore => ({
  take: async ({ kind, id, memberId }, at) => {
    await db.batch([db.prepare(TAKE).bind(kind, id, memberId, at), db.prepare(FORGET_OLD).bind(at - DAY_MS)]);
  },
  fresh: async (since) => (await db.prepare(FRESH).bind(since).all<Row>()).results.flatMap(takeOf),
});

// Tests and local runs: the same rules in memory.
export function createMemoryTakes(): TakeStore {
  const takes = new Map<string, Take & { readonly at: number }>();
  return {
    take: async (take, at) => void takes.set(`${take.kind}:${take.id}`, { ...take, at }),
    fresh: async (since) =>
      [...takes.values()]
        .filter((take) => take.at >= since)
        .map(({ kind, id, memberId }) => ({ kind, id, memberId })),
  };
}
