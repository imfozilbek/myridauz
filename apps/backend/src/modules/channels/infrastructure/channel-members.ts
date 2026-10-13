import type { ChannelMembers } from '../application/my-channels';

const MARK = `INSERT INTO channel_members (chat, user_id, member, at) VALUES (?1, ?2, ?3, ?4)
  ON CONFLICT (chat, user_id) DO UPDATE SET member = excluded.member, at = excluded.at
  WHERE excluded.at >= channel_members.at`;
const JOINED = 'SELECT chat FROM channel_members WHERE user_id = ?1 AND member = 1';
const FORGET = 'DELETE FROM channel_members WHERE user_id = ?1';

// Table channel_members (migration 0064): one row a person and channel; a late update never wins
// over a newer one, Telegram may send them out of order.
export const d1ChannelMembers = (db: D1Database): ChannelMembers => ({
  joined: async (userId) =>
    new Set((await db.prepare(JOINED).bind(userId).all<{ chat: string }>()).results.map((row) => row.chat)),
  mark: async ({ chat, userId, member, at }) => {
    await db.prepare(MARK).bind(chat, userId, Number(member), at).run();
  },
  forget: async (userId) => {
    await db.prepare(FORGET).bind(userId).run();
  },
});

// In memory: tests and local runs without D1. The channels of each person.
export function createMemoryChannelMembers(): ChannelMembers {
  const people = new Map<number, Map<string, { member: boolean; at: number }>>();
  return {
    joined: async (userId) =>
      new Set([...(people.get(userId) ?? [])].filter(([, row]) => row.member).map(([chat]) => chat)),
    mark: async ({ chat, userId, member, at }) => {
      const rows = people.get(userId) ?? new Map<string, { member: boolean; at: number }>();
      if ((rows.get(chat)?.at ?? at) <= at) rows.set(chat, { member, at });
      people.set(userId, rows);
    },
    forget: async (userId) => void people.delete(userId),
  };
}
