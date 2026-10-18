import type { Bindings } from '../../../env';
import type { NotificationJob } from '../application/job';

type Bot = NotificationJob['bot'];

// The people who blocked a bot (G46, docs/191): the bot is quiet to them until /start.
type BotBlocks = {
  has(bot: Bot, chatId: number): Promise<boolean>;
  mark(bot: Bot, chatId: number, at: number): Promise<void>;
  clear(bot: Bot, chatId: number): Promise<void>;
};

// Table bot_blocks (migration 0078).
const HAS = 'SELECT 1 FROM bot_blocks WHERE bot = ?1 AND chat_id = ?2';
const MARK = 'INSERT OR IGNORE INTO bot_blocks (bot, chat_id, blocked_at) VALUES (?1, ?2, ?3)';
const CLEAR = 'DELETE FROM bot_blocks WHERE bot = ?1 AND chat_id = ?2';
const FORGET = 'DELETE FROM bot_blocks WHERE chat_id = ?1';

const d1Blocks = (db: D1Database): BotBlocks => ({
  has: async (bot, chatId) => (await db.prepare(HAS).bind(bot, chatId).first()) !== null,
  mark: async (bot, chatId, at) => void (await db.prepare(MARK).bind(bot, chatId, at).run()),
  clear: async (bot, chatId) => void (await db.prepare(CLEAR).bind(bot, chatId).run()),
});

// Without D1 (tests, local runs) the marks live in memory.
const marks = new Set<string>();
const key = (bot: Bot, chatId: number) => `${bot}:${String(chatId)}`;
const memoryBlocks: BotBlocks = {
  has: async (bot, chatId) => marks.has(key(bot, chatId)),
  mark: async (bot, chatId) => void marks.add(key(bot, chatId)),
  clear: async (bot, chatId) => void marks.delete(key(bot, chatId)),
};

export const blocksOf = (env: Bindings): BotBlocks => (env.DB ? d1Blocks(env.DB) : memoryBlocks);

// A deleted account takes its marks with it (docs/30).
export async function forgetBotBlocks(env: Bindings, userId: number): Promise<void> {
  if (env.DB) await env.DB.prepare(FORGET).bind(userId).run();
  else for (const mark of marks) if (mark.endsWith(`:${String(userId)}`)) marks.delete(mark);
}
