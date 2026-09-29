import type { ChannelPost, ChannelPostStore } from '../application/ports';

type Row = { trip_id: string; channel: string; message_id: number };

// Table channel_posts (migrations 0010, 0011).
export const d1ChannelPosts = (db: D1Database): ChannelPostStore => ({
  save: async (post, departAt) => {
    await db
      .prepare(
        'INSERT OR REPLACE INTO channel_posts (trip_id, channel, message_id, depart_at) VALUES (?, ?, ?, ?)',
      )
      .bind(post.tripId, post.channel, post.messageId, departAt)
      .run();
  },
  byTrip: async (tripId) => {
    const { results } = await db
      .prepare('SELECT * FROM channel_posts WHERE trip_id = ?')
      .bind(tripId)
      .all<Row>();
    return results.map((row) => ({ tripId: row.trip_id, channel: row.channel, messageId: row.message_id }));
  },
  departed: async (now) => {
    const { results } = await db
      .prepare('SELECT DISTINCT trip_id FROM channel_posts WHERE closed = 0 AND depart_at <= ?')
      .bind(now)
      .all<{ trip_id: string }>();
    return results.map((row) => row.trip_id);
  },
  close: async (tripId) => {
    await db.prepare('UPDATE channel_posts SET closed = 1 WHERE trip_id = ?').bind(tripId).run();
  },
});

type Kept = ChannelPost & { readonly departAt: number; closed: boolean };

// In memory: tests and local runs without D1.
export function createMemoryChannelPosts(): ChannelPostStore {
  const posts: Kept[] = [];
  return {
    save: async (post, departAt) => {
      const at = posts.findIndex((known) => known.tripId === post.tripId && known.channel === post.channel);
      if (at >= 0) posts.splice(at, 1);
      posts.push({ ...post, departAt, closed: false });
    },
    byTrip: async (tripId) =>
      posts
        .filter((post) => post.tripId === tripId)
        .map(({ tripId: id, channel, messageId }) => ({ tripId: id, channel, messageId })),
    departed: async (now) => [
      ...new Set(posts.filter((post) => !post.closed && post.departAt <= now).map((post) => post.tripId)),
    ],
    close: async (tripId) => {
      for (const post of posts) if (post.tripId === tripId) post.closed = true;
    },
  };
}
