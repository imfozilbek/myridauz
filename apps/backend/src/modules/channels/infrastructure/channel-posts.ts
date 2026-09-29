import type { ChannelPost, ChannelPostStore } from '../application/ports';

type Row = { trip_id: string; channel: string; message_id: number };

// Table channel_posts (migrations/0010_channels_subscriptions.sql).
export const d1ChannelPosts = (db: D1Database): ChannelPostStore => ({
  save: async (post) => {
    await db
      .prepare('INSERT OR REPLACE INTO channel_posts (trip_id, channel, message_id) VALUES (?, ?, ?)')
      .bind(post.tripId, post.channel, post.messageId)
      .run();
  },
  byTrip: async (tripId) => {
    const { results } = await db
      .prepare('SELECT * FROM channel_posts WHERE trip_id = ?')
      .bind(tripId)
      .all<Row>();
    return results.map((row) => ({ tripId: row.trip_id, channel: row.channel, messageId: row.message_id }));
  },
});

// In memory: tests and local runs without D1.
export function createMemoryChannelPosts(): ChannelPostStore {
  const posts: ChannelPost[] = [];
  return {
    save: async (post) => {
      const at = posts.findIndex((known) => known.tripId === post.tripId && known.channel === post.channel);
      if (at >= 0) posts.splice(at, 1);
      posts.push(post);
    },
    byTrip: async (tripId) => posts.filter((post) => post.tripId === tripId),
  };
}
