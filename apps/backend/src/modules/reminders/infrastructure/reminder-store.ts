// Table trip_reminders (migrations/0010_channels_subscriptions.sql): a key once, then never again.
export const d1First = (db: D1Database) => async (key: string) => {
  const result = await db
    .prepare('INSERT OR IGNORE INTO trip_reminders (key, sent_at) VALUES (?, ?)')
    .bind(key, Date.now())
    .run();
  return result.meta.changes > 0;
};

// In memory: tests and local runs without D1.
export function createMemoryFirst() {
  const seen = new Set<string>();
  return async (key: string) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}
