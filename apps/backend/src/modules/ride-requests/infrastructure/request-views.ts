import type { RequestViewStore } from '../application/ports';

const RECORD = 'INSERT OR IGNORE INTO request_views (request_id, user_id, first_at) VALUES (?1, ?2, ?3)';
const FORGET = 'DELETE FROM request_views WHERE user_id = ?1';
const countSql = (size: number) =>
  `SELECT request_id, COUNT(*) AS views FROM request_views
  WHERE request_id IN (${Array.from({ length: size }, (_, n) => `?${n + 1}`).join(', ')})
  GROUP BY request_id`;

// Table request_views (migration 0062): the first look of each driver at a request (G76).
export const d1RequestViews = (db: D1Database): RequestViewStore => ({
  record: async (requestIds, userId, at) => {
    if (requestIds.length === 0) return;
    const first = new Date(at).toISOString();
    await db.batch(requestIds.map((id) => db.prepare(RECORD).bind(id, String(userId), first)));
  },
  counts: async (requestIds) => {
    if (requestIds.length === 0) return new Map();
    const rows = await db
      .prepare(countSql(requestIds.length))
      .bind(...requestIds)
      .all<{ request_id: string; views: number }>();
    return new Map(rows.results.map((row) => [row.request_id, row.views]));
  },
  forget: async (userId) => {
    await db.prepare(FORGET).bind(String(userId)).run();
  },
});

// In memory: tests and local runs without D1.
export function createMemoryRequestViews(): RequestViewStore {
  const views = new Map<string, Set<number>>();
  return {
    record: async (requestIds, userId) => {
      for (const id of requestIds) views.set(id, (views.get(id) ?? new Set()).add(userId));
    },
    counts: async (requestIds) =>
      new Map(requestIds.flatMap((id) => (views.has(id) ? [[id, views.get(id)?.size ?? 0] as const] : []))),
    forget: async (userId) => {
      for (const people of views.values()) people.delete(userId);
    },
  };
}
