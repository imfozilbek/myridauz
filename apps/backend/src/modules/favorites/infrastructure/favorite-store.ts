import type { FavoriteStore } from '../application/ports';

// Table favorite_drivers (migrations/0014_comfort.sql).
export const d1Favorites = (db: D1Database): FavoriteStore => {
  const ids = async (sql: string, value: number) =>
    (await db.prepare(sql).bind(value).all<{ id: number }>()).results.map((row) => row.id);
  return {
    add: async (passengerId, driverId, at) => {
      await db
        .prepare(
          'INSERT OR IGNORE INTO favorite_drivers (passenger_id, driver_id, created_at) VALUES (?, ?, ?)',
        )
        .bind(passengerId, driverId, at)
        .run();
    },
    remove: async (passengerId, driverId) => {
      const result = await db
        .prepare('DELETE FROM favorite_drivers WHERE passenger_id = ? AND driver_id = ?')
        .bind(passengerId, driverId)
        .run();
      return result.meta.changes > 0;
    },
    driversOf: (passengerId) =>
      ids(
        'SELECT driver_id AS id FROM favorite_drivers WHERE passenger_id = ? ORDER BY created_at DESC',
        passengerId,
      ),
    fansOf: (driverId) =>
      ids('SELECT passenger_id AS id FROM favorite_drivers WHERE driver_id = ?', driverId),
    forget: async (userId) => {
      await db
        .prepare('DELETE FROM favorite_drivers WHERE passenger_id = ? OR driver_id = ?')
        .bind(userId, userId)
        .run();
    },
  };
};

// In memory: tests and local runs without D1.
export function createMemoryFavorites(): FavoriteStore {
  const saved: { passengerId: number; driverId: number; at: number }[] = [];
  const index = (passengerId: number, driverId: number) =>
    saved.findIndex((item) => item.passengerId === passengerId && item.driverId === driverId);
  return {
    add: async (passengerId, driverId, at) => {
      if (index(passengerId, driverId) < 0) saved.push({ passengerId, driverId, at });
    },
    remove: async (passengerId, driverId) => {
      const found = index(passengerId, driverId);
      if (found >= 0) saved.splice(found, 1);
      return found >= 0;
    },
    driversOf: async (passengerId) =>
      saved
        .filter((item) => item.passengerId === passengerId)
        .sort((a, b) => b.at - a.at)
        .map((item) => item.driverId),
    fansOf: async (driverId) =>
      saved.filter((item) => item.driverId === driverId).map((item) => item.passengerId),
    forget: async (userId) => {
      const kept = saved.filter((item) => item.passengerId !== userId && item.driverId !== userId);
      saved.splice(0, saved.length, ...kept);
    },
  };
}
