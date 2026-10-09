import type { Bindings } from '../../../env';
import type { CardRow, CardStore } from '../application/cards';

type Row = { message_id: number; hash: string; pinned: number };

const FIND = 'SELECT message_id, hash, pinned FROM bot_cards WHERE bot = ?1 AND chat_id = ?2 AND card = ?3';
const SAVE =
  'INSERT OR REPLACE INTO bot_cards (bot, chat_id, card, message_id, hash, pinned, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)';
const FORGET = 'DELETE FROM bot_cards WHERE chat_id = ?1';

// Table bot_cards (migration 0052).
export const d1Cards = (db: D1Database): CardStore => ({
  find: async (bot, chatId, key) => {
    const row = await db.prepare(FIND).bind(bot, chatId, key).first<Row>();
    return row ? { messageId: row.message_id, hash: row.hash, pinned: row.pinned === 1 } : null;
  },
  save: async (bot, chatId, key, row, now) => {
    await db
      .prepare(SAVE)
      .bind(bot, chatId, key, row.messageId, row.hash, row.pinned ? 1 : 0, now)
      .run();
  },
});

// In memory: tests and local runs without D1.
export function createMemoryCards(): CardStore {
  const rows = new Map<string, CardRow>();
  const id = (bot: string, chatId: number, key: string) => `${bot}|${chatId}|${key}`;
  return {
    find: async (bot, chatId, key) => rows.get(id(bot, chatId, key)) ?? null,
    save: async (bot, chatId, key, row) => void rows.set(id(bot, chatId, key), row),
  };
}

// A deleted account takes its cards with it (docs/30).
export async function forgetCards(env: Bindings, userId: number): Promise<void> {
  await env.DB?.prepare(FORGET).bind(userId).run();
}
