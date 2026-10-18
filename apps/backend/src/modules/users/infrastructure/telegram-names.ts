import type { TelegramNames, TelegramSeen } from '../application/ports';

const BOTS: readonly TelegramSeen['bot'][] = ['passenger', 'driver', 'admin'];
const botOf = (bot: string): TelegramSeen['bot'] => BOTS.find((known) => known === bot) ?? 'passenger';

export function d1TelegramNames(db: D1Database): TelegramNames {
  return {
    keep: async (userId, seen, at) => {
      await db
        .prepare(
          'INSERT INTO telegram_names (user_id, username, bot, updated_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (user_id) DO UPDATE SET username = excluded.username, bot = excluded.bot, updated_at = excluded.updated_at WHERE username IS NOT excluded.username OR bot IS NOT excluded.bot',
        )
        .bind(userId, seen.username, seen.bot, at)
        .run();
    },
    find: async (userId) => {
      const row = await db
        .prepare('SELECT username, bot FROM telegram_names WHERE user_id = ?')
        .bind(userId)
        .first<{ username: string | null; bot: string }>();
      return row ? { username: row.username, bot: botOf(row.bot) } : null;
    },
    forget: async (userId) => {
      await db.prepare('DELETE FROM telegram_names WHERE user_id = ?').bind(userId).run();
    },
  };
}

export function createMemoryTelegramNames(): TelegramNames {
  const names = new Map<number, TelegramSeen>();
  return {
    keep: async (userId, seen) => void names.set(userId, seen),
    find: async (userId) => names.get(userId) ?? null,
    forget: async (userId) => void names.delete(userId),
  };
}
