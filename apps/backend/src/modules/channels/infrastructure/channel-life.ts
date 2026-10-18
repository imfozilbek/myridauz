import { NO_LIFE, type ChannelLife, type Life } from '../application/channel-life';

const MOVED = `INSERT INTO channel_days (day, chat, joined, gone) VALUES (?1, ?2, ?3, ?4)
  ON CONFLICT (day, chat) DO UPDATE SET joined = joined + excluded.joined, gone = gone + excluded.gone`;
const COUNTED = `INSERT INTO channel_days (day, chat, subscribers) VALUES (?1, ?2, ?3)
  ON CONFLICT (day, chat) DO UPDATE SET subscribers = excluded.subscribers`;
// A late update never wins over a newer one: Telegram may send them out of order.
const REACTED = `INSERT INTO post_reactions (chat, message_id, reactions, at) VALUES (?1, ?2, ?3, ?4)
  ON CONFLICT (chat, message_id) DO UPDATE SET reactions = excluded.reactions, at = excluded.at
  WHERE excluded.at >= post_reactions.at`;
const MOVES = `SELECT chat, SUM(joined) AS joined, SUM(gone) AS gone FROM channel_days
  WHERE day >= ?1 GROUP BY chat`;
// Grouped by channel, SQLite would read every post in the order of the key: the index of the time
// reads only the week (docs/117).
const REACTIONS = `SELECT chat, SUM(reactions) AS reactions, MAX(reactions) AS top
  FROM post_reactions INDEXED BY post_reactions_at WHERE at >= ?1 GROUP BY chat`;

type MoveRow = { chat: string; joined: number; gone: number };
type ReactionRow = { chat: string; reactions: number; top: number };

const together = (moves: readonly MoveRow[], reactions: readonly ReactionRow[]) => {
  const life = new Map<string, Life>();
  for (const { chat, joined, gone } of moves) life.set(chat, { ...NO_LIFE, joined, gone });
  for (const { chat, reactions: sum, top } of reactions)
    life.set(chat, { ...(life.get(chat) ?? NO_LIFE), reactions: sum, topReactions: top });
  return life;
};

// Tables channel_days and post_reactions (migration 0075): a row a channel and day, a row a post.
export const d1ChannelLife = (db: D1Database): ChannelLife => ({
  moved: async (day, chat, move) => {
    const [joined, gone] = move === 'joined' ? [1, 0] : [0, 1];
    await db.prepare(MOVED).bind(day, chat, joined, gone).run();
  },
  counted: async (day, chat, subscribers) => {
    await db.prepare(COUNTED).bind(day, chat, subscribers).run();
  },
  reacted: async (chat, messageId, reactions, at) => {
    await db.prepare(REACTED).bind(chat, messageId, reactions, at).run();
  },
  since: async (day, at) => {
    const [moves, reactions] = await Promise.all([
      db.prepare(MOVES).bind(day).all<MoveRow>(),
      db.prepare(REACTIONS).bind(at).all<ReactionRow>(),
    ]);
    return together(moves.results, reactions.results);
  },
});

// In memory: tests and local runs without D1.
export function createMemoryChannelLife(): ChannelLife {
  const days = new Map<string, MoveRow & { day: string }>();
  const posts = new Map<string, ReactionRow & { at: number }>();
  return {
    moved: async (day, chat, move) => {
      const row = days.get(`${day}|${chat}`) ?? { day, chat, joined: 0, gone: 0 };
      days.set(`${day}|${chat}`, { ...row, [move]: row[move] + 1 });
    },
    // The people of a day are kept for the history in D1 only: nothing here reads them back.
    counted: async () => undefined,
    reacted: async (chat, messageId, reactions, at) => {
      const key = `${chat}|${messageId}`;
      if ((posts.get(key)?.at ?? at) <= at) posts.set(key, { chat, reactions, top: reactions, at });
    },
    since: async (day, at) => {
      const moves = [...days.values()].filter((row) => row.day >= day);
      const byChat = new Map<string, MoveRow>();
      for (const row of moves) {
        const sum = byChat.get(row.chat) ?? { chat: row.chat, joined: 0, gone: 0 };
        byChat.set(row.chat, { chat: row.chat, joined: sum.joined + row.joined, gone: sum.gone + row.gone });
      }
      const recent = [...posts.values()].filter((row) => row.at >= at);
      const reactions = [...new Set(recent.map((row) => row.chat))].map((chat) => {
        const mine = recent.filter((row) => row.chat === chat);
        const sums = mine.map((row) => row.reactions);
        return { chat, reactions: sums.reduce((sum, value) => sum + value, 0), top: Math.max(...sums) };
      });
      return together([...byChat.values()], reactions);
    },
  };
}
