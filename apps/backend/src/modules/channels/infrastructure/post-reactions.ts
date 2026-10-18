import type { PostReactions, TopPost } from '../application/post-reactions';

const SET = `UPDATE channel_posts SET reactions = ?1, reacted_at = ?2
  WHERE channel IN (?3, ?4) AND message_id = ?5`;
// One row a channel: SQLite gives the message of the row with the most reactions.
const TOP = `SELECT channel, message_id, MAX(reactions) AS reactions FROM channel_posts
  WHERE reacted_at >= ?1 AND reactions > 0 GROUP BY channel`;
type Row = { channel: string; message_id: number; reactions: number };

// Columns reactions and reacted_at of channel_posts (migration 0076).
export const d1PostReactions = (db: D1Database): PostReactions => ({
  set: async ({ chat, name }, messageId, reactions, at) => {
    await db
      .prepare(SET)
      .bind(reactions, at, chat, name ?? chat, messageId)
      .run();
  },
  top: async (since) =>
    new Map(
      (await db.prepare(TOP).bind(since).all<Row>()).results.map((row) => [
        row.channel,
        { messageId: row.message_id, reactions: row.reactions },
      ]),
    ),
});

// Tests and local runs: the reactions of every post heard, in memory.
export function createMemoryPostReactions(): PostReactions {
  const posts = new Map<string, TopPost & { readonly chat: string; readonly at: number }>();
  return {
    set: async ({ chat, name }, messageId, reactions, at) => {
      for (const key of name ? [chat, name] : [chat])
        posts.set(`${key} ${messageId}`, { chat: key, messageId, reactions, at });
    },
    top: async (since) => {
      const top = new Map<string, TopPost>();
      for (const { chat, messageId, reactions, at } of posts.values())
        if (at >= since && reactions > (top.get(chat)?.reactions ?? 0))
          top.set(chat, { messageId, reactions });
      return top;
    },
  };
}
