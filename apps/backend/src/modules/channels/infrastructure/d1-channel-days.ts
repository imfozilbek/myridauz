import type { ChannelDays, ChannelMoves } from '../application/channel-days';

const JOINED = `INSERT INTO channel_days (day, chat, joined) VALUES (?1, ?2, 1)
  ON CONFLICT (day, chat) DO UPDATE SET joined = joined + 1`;
const GONE = `INSERT INTO channel_days (day, chat, gone) VALUES (?1, ?2, 1)
  ON CONFLICT (day, chat) DO UPDATE SET gone = gone + 1`;
const COUNTED = `INSERT INTO channel_days (day, chat, members) VALUES (?1, ?2, ?3)
  ON CONFLICT (day, chat) DO UPDATE SET members = excluded.members`;
const MOVES = `SELECT chat, SUM(joined) AS joined, SUM(gone) AS gone FROM channel_days
  WHERE day >= ?1 GROUP BY chat`;

// Table channel_days (migration 0075): one row a day and channel, 67 rows a day at most.
export const d1ChannelDays = (db: D1Database): ChannelDays => ({
  moved: async (chat, day, joined) => {
    await db
      .prepare(joined ? JOINED : GONE)
      .bind(day, chat)
      .run();
  },
  counted: async (chat, day, members) => {
    await db.prepare(COUNTED).bind(day, chat, members).run();
  },
  movesSince: async (day) => (await db.prepare(MOVES).bind(day).all<ChannelMoves>()).results,
});

// Tests and local runs: the same days in memory.
export function createMemoryChannelDays(): ChannelDays {
  const days = new Map<string, { day: string; chat: string; joined: number; gone: number }>();
  const rowOf = (chat: string, day: string) =>
    days.get(`${day} ${chat}`) ?? { day, chat, joined: 0, gone: 0 };
  return {
    moved: async (chat, day, joined) => {
      const row = rowOf(chat, day);
      days.set(
        `${day} ${chat}`,
        joined ? { ...row, joined: row.joined + 1 } : { ...row, gone: row.gone + 1 },
      );
    },
    counted: async (chat, day) => void days.set(`${day} ${chat}`, rowOf(chat, day)),
    movesSince: async (since) => {
      const sums = new Map<string, ChannelMoves>();
      for (const { day, chat, joined, gone } of days.values()) {
        if (day < since) continue;
        const sum = sums.get(chat) ?? { chat, joined: 0, gone: 0 };
        sums.set(chat, { chat, joined: sum.joined + joined, gone: sum.gone + gone });
      }
      return [...sums.values()];
    },
  };
}
