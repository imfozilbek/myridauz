import type { NotificationJob } from '../application/job';

type Bot = NotificationJob['bot'];

// The pace of the bots (G85, docs/122): a bot Telegram answered 429 waits as a whole (T4), a channel
// takes its posts one by one, 18 a minute (T7).
export type PaceStore = {
  // The bots that wait now, with the moment their wait ends.
  pauses(now: number): Promise<ReadonlyMap<Bot, number>>;
  pause(bot: Bot, until: number): Promise<void>;
  // The moment the next post of the chat may go; the post after it waits `stepMs` more.
  slot(chat: string, now: number, stepMs: number): Promise<number>;
};

// Tables bot_pauses and chat_pace (migration 0073). A later wait never shortens a longer one.
const PAUSES = 'SELECT bot, until FROM bot_pauses WHERE until > ?';
const PAUSE = `INSERT INTO bot_pauses (bot, until) VALUES (?1, ?2)
  ON CONFLICT (bot) DO UPDATE SET until = max(until, excluded.until)`;
const SLOT = `INSERT INTO chat_pace (chat, next_at) VALUES (?1, ?2 + ?3)
  ON CONFLICT (chat) DO UPDATE SET next_at = max(next_at, ?2) + ?3 RETURNING next_at`;

export const d1Pace = (db: D1Database): PaceStore => ({
  pauses: async (now) =>
    new Map(
      (await db.prepare(PAUSES).bind(now).all<{ bot: Bot; until: number }>()).results.map(
        (row) => [row.bot, row.until] as const,
      ),
    ),
  pause: async (bot, until) => {
    await db.prepare(PAUSE).bind(bot, until).run();
  },
  slot: async (chat, now, stepMs) => {
    const row = await db.prepare(SLOT).bind(chat, now, stepMs).first<{ next_at: number }>();
    return (row?.next_at ?? now + stepMs) - stepMs;
  },
});

// Without D1 (unit tests, local runs) every bot goes at once: no wait is kept between runs.
export const noPace: PaceStore = {
  pauses: async () => new Map(),
  pause: async () => undefined,
  slot: async (_chat, now) => now,
};
