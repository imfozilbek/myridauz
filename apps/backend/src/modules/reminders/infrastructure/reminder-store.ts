// Table trip_reminders (migrations/0010_channels_subscriptions.sql): a key once, then never again.
export const d1First = (db: D1Database) => async (key: string) => {
  const result = await db
    .prepare('INSERT OR IGNORE INTO trip_reminders (key, sent_at) VALUES (?, ?)')
    .bind(key, Date.now())
    .run();
  return result.meta.changes > 0;
};

// The keys of reminders the queue refused: the next run of the Cron holds them again (G89).
export const d1Forget = (db: D1Database) => async (keys: readonly string[]) => {
  for (const key of keys) await db.prepare('DELETE FROM trip_reminders WHERE key = ?').bind(key).run();
};

// In memory: tests and local runs without D1.
export function createMemoryFirst() {
  const seen = new Set<string>();
  const first = async (key: string) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  return Object.assign(first, {
    forget: async (keys: readonly string[]) => keys.forEach((key) => seen.delete(key)),
  });
}
