import type { TripViewStore } from '../application/publicity';

const RECORD = 'INSERT OR IGNORE INTO trip_views (trip_id, user_id, first_at) VALUES (?1, ?2, ?3)';
const COUNT = 'SELECT COUNT(*) AS views FROM trip_views WHERE trip_id = ?1';
const FORGET = 'DELETE FROM trip_views WHERE user_id = ?1';

// Table trip_views (migration 0048): the first open of a trip by each person, the time in ISO form.
export const d1TripViews = (db: D1Database): TripViewStore => ({
  record: async (tripId, userId, at) => {
    await db.prepare(RECORD).bind(tripId, String(userId), new Date(at).toISOString()).run();
  },
  count: async (tripId) => (await db.prepare(COUNT).bind(tripId).first<{ views: number }>())?.views ?? 0,
  forget: async (userId) => {
    await db.prepare(FORGET).bind(String(userId)).run();
  },
});

// In memory: tests and local runs without D1.
export function createMemoryTripViews(): TripViewStore {
  const views = new Map<string, Set<number>>();
  return {
    record: async (tripId, userId) => void views.set(tripId, (views.get(tripId) ?? new Set()).add(userId)),
    count: async (tripId) => views.get(tripId)?.size ?? 0,
    forget: async (userId) => {
      for (const people of views.values()) people.delete(userId);
    },
  };
}
