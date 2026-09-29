import type { StatsCache } from '../application/ports';

// Saved answers and sent signals (migration 0013); old rows are replaced, never piled up.
export const d1Cache = (db: D1Database): StatsCache => ({
  get: async (key, now) =>
    (
      await db
        .prepare('SELECT body FROM stats_cache WHERE key = ? AND until > ?')
        .bind(key, now)
        .first<{ body: string }>()
    )?.body ?? undefined,
  put: async (key, body, until) => {
    await db
      .prepare('INSERT OR REPLACE INTO stats_cache (key, body, until) VALUES (?, ?, ?)')
      .bind(key, body, until)
      .run();
  },
});

export function createMemoryCache(): StatsCache {
  const saved = new Map<string, { body: string; until: number }>();
  return {
    get: async (key, now) => {
      const row = saved.get(key);
      return row && row.until > now ? row.body : undefined;
    },
    put: async (key, body, until) => void saved.set(key, { body, until }),
  };
}
