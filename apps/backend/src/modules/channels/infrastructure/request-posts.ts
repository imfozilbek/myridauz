import type { PostBot, RequestPost, RequestPostStore } from '../application/request-posts';

type Row = { request_id: string; chat: string; message_id: number; bot: PostBot };

// Table request_posts (migrations 0087, 0088).
export const d1RequestPosts = (db: D1Database): RequestPostStore => ({
  save: async (post) => {
    await db
      .prepare('INSERT OR REPLACE INTO request_posts (request_id, chat, message_id, bot) VALUES (?, ?, ?, ?)')
      .bind(post.requestId, post.chat, post.messageId, post.bot)
      .run();
  },
  of: async (requestId) => {
    const { results } = await db
      .prepare('SELECT * FROM request_posts WHERE request_id = ?')
      .bind(requestId)
      .all<Row>();
    return results.map((row) => ({
      requestId: row.request_id,
      chat: row.chat,
      messageId: row.message_id,
      bot: row.bot,
    }));
  },
  forget: async (requestId) => {
    await db.prepare('DELETE FROM request_posts WHERE request_id = ?').bind(requestId).run();
  },
});

// In memory: tests and local runs without D1.
export function createMemoryRequestPosts(): RequestPostStore {
  let posts: RequestPost[] = [];
  return {
    save: async (post) => {
      posts = [
        ...posts.filter((known) => known.requestId !== post.requestId || known.chat !== post.chat),
        post,
      ];
    },
    of: async (requestId) => posts.filter((post) => post.requestId === requestId),
    forget: async (requestId) => {
      posts = posts.filter((post) => post.requestId !== requestId);
    },
  };
}
