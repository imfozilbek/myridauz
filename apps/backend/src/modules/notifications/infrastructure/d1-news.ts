import type { NewsLine, NewsStore } from '../application/news';

const PUT = `INSERT OR REPLACE INTO bot_news (bot, chat_id, card, item, line, sort, created_at)
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`;
const LINES = 'SELECT line FROM bot_news WHERE bot = ?1 AND chat_id = ?2 AND card = ?3 ORDER BY sort, item';

// Table bot_news (migration 0053).
export const d1News = (db: D1Database): NewsStore => ({
  put: async (bot, chatId, card, line, now) => {
    await db.prepare(PUT).bind(bot, chatId, card, line.id, line.text, line.order, now).run();
  },
  lines: async (bot, chatId, card) =>
    (await db.prepare(LINES).bind(bot, chatId, card).all<{ line: string }>()).results.map((row) => row.line),
});

// In memory: tests and local runs without D1.
export function createMemoryNews(): NewsStore {
  const cards = new Map<string, Map<string, NewsLine>>();
  const id = (bot: string, chatId: number, card: string) => `${bot}|${chatId}|${card}`;
  return {
    put: async (bot, chatId, card, line) => {
      const lines = cards.get(id(bot, chatId, card)) ?? new Map<string, NewsLine>();
      cards.set(id(bot, chatId, card), lines.set(line.id, line));
    },
    lines: async (bot, chatId, card) =>
      [...(cards.get(id(bot, chatId, card))?.values() ?? [])]
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
        .map((line) => line.text),
  };
}
