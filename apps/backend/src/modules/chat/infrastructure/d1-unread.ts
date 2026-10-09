import type { Bindings } from '../../../env';
import { sendSignals } from '../../feed';
import type { UnreadCounter } from '../application/ports';

const ADD = `INSERT INTO chat_unread (chat_key, user_id, count) VALUES (?1, ?2, 1)
  ON CONFLICT (chat_key, user_id) DO UPDATE SET count = count + 1`;
const CLEAR = 'DELETE FROM chat_unread WHERE chat_key = ?1 AND user_id = ?2';
const OF_USER = 'SELECT chat_key AS key, count FROM chat_unread WHERE user_id = ?1';
const FORGET = 'DELETE FROM chat_unread WHERE user_id = ?1';

// The unread messages of one chat in D1, so a list of bookings reads them in one query (G53).
// The open Mini App of that person refreshes at once (docs/64).
export const d1Unread = (env: Bindings, key: string): UnreadCounter => ({
  add: async (to) => {
    await env.DB?.prepare(ADD).bind(key, to.userId).run();
    await sendSignals(env, [{ userId: to.userId, app: to.role }]);
  },
  clear: async (userId) => {
    const done = await env.DB?.prepare(CLEAR).bind(key, userId).run();
    return (done?.meta.changes ?? 0) > 0;
  },
});

// The unread messages of a person in each of their chats, by the chat key.
export async function unreadOf(env: Bindings, userId: number): Promise<ReadonlyMap<string, number>> {
  const rows = env.DB
    ? (await env.DB.prepare(OF_USER).bind(userId).all<{ key: string; count: number }>()).results
    : [];
  return new Map(rows.map((row) => [row.key, row.count]));
}

// A deleted account (docs/30): its counters go too.
export async function forgetUnread(env: Bindings, userId: number): Promise<void> {
  await env.DB?.prepare(FORGET).bind(userId).run();
}
