import { MINUTE_MS } from '@platform/contracts';
import type { NotificationJob } from '../application/job';

type Bot = NotificationJob['bot'];

// The pace of the bots (G85, docs/122): a bot Telegram answered 429 waits as a whole (T4), a channel
// takes `perMinute` new posts a minute and the next ones wait for a later minute (T7).
export type PaceStore = {
  // The bots that wait now, with the moment their wait ends.
  pauses(now: number): Promise<ReadonlyMap<Bot, number>>;
  pause(bot: Bot, until: number): Promise<void>;
  // The moment a new post of the chat may go: now, or the start of the first minute with room.
  slot(chat: string, now: number, perMinute: number): Promise<number>;
};

// Tables bot_pauses and chat_pace (migration 0073). A later wait never shortens a longer one.
const PAUSES = 'SELECT bot, until FROM bot_pauses WHERE until > ?';
const PAUSE = `INSERT INTO bot_pauses (bot, until) VALUES (?1, ?2)
  ON CONFLICT (bot) DO UPDATE SET until = max(until, excluded.until)`;
const FORGET = 'DELETE FROM chat_pace WHERE chat = ? AND minute < ?';
const TAKE = `INSERT INTO chat_pace (chat, minute, sent) VALUES (?1, ?2, 1)
  ON CONFLICT (chat, minute) DO UPDATE SET sent = sent + 1 RETURNING sent`;
// A post never waits longer than this: a channel that busy is a fault, not a pace.
const MAX_MINUTES = 60;

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
  slot: async (chat, now, perMinute) => {
    const current = Math.floor(now / MINUTE_MS);
    await db.prepare(FORGET).bind(chat, current).run();
    for (let minute = current; minute < current + MAX_MINUTES; minute += 1) {
      const row = await db.prepare(TAKE).bind(chat, minute).first<{ sent: number }>();
      if ((row?.sent ?? 1) <= perMinute) return minute === current ? now : minute * MINUTE_MS;
    }
    return (current + MAX_MINUTES) * MINUTE_MS;
  },
});

// Without D1 (unit tests, local runs) every bot goes at once: no wait is kept between runs.
export const noPace: PaceStore = {
  pauses: async () => new Map(),
  pause: async () => undefined,
  slot: async (_chat, now) => now,
};
