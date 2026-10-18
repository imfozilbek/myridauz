import type { TelegramNames } from '../application/ports';

export function d1TelegramNames(db: D1Database): TelegramNames {
  return {
    keep: async (userId, username, at) => {
      await db
        .prepare(
          'INSERT INTO telegram_names (user_id, username, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT (user_id) DO UPDATE SET username = excluded.username, updated_at = excluded.updated_at WHERE username IS NOT excluded.username',
        )
        .bind(userId, username, at)
        .run();
    },
    find: async (userId) =>
      (
        await db
          .prepare('SELECT username FROM telegram_names WHERE user_id = ?')
          .bind(userId)
          .first<{ username: string | null }>()
      )?.username ?? null,
    forget: async (userId) => {
      await db.prepare('DELETE FROM telegram_names WHERE user_id = ?').bind(userId).run();
    },
  };
}

export function createMemoryTelegramNames(): TelegramNames {
  const names = new Map<number, string | null>();
  return {
    keep: async (userId, username) => void names.set(userId, username),
    find: async (userId) => names.get(userId) ?? null,
    forget: async (userId) => void names.delete(userId),
  };
}
