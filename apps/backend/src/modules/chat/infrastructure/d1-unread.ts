import type { UnreadChat } from '@platform/contracts';
import type { Bindings } from '../../../env';
import { sendSignals } from '../../feed';
import type { Role, UnreadCounter } from '../application/ports';

const ADD = `INSERT INTO chat_unread (chat_key, user_id, count, role, text, at) VALUES (?1, ?2, 1, ?3, ?4, ?5)
  ON CONFLICT (chat_key, user_id) DO UPDATE SET count = count + 1, role = ?3, text = ?4, at = ?5`;
const CLEAR = 'DELETE FROM chat_unread WHERE chat_key = ?1 AND user_id = ?2';
const OF_USER = 'SELECT chat_key AS key, count FROM chat_unread WHERE user_id = ?1';
const FORGET = 'DELETE FROM chat_unread WHERE user_id = ?1';
// The sheet shows one chat at a time: a few of the newest are enough (G68).
const LAST_SHOWN = 5;
const LAST = `SELECT chat_key AS key, count, text, at FROM chat_unread
  WHERE user_id = ?1 AND role = ?2 AND text IS NOT NULL ORDER BY at DESC LIMIT ${LAST_SHOWN}`;

// The unread messages of one chat in D1, so a list of bookings reads them in one query (G53).
// The open Mini App of that person refreshes at once (docs/64).
export const d1Unread = (env: Bindings, key: string): UnreadCounter => ({
  add: async (to, last) => {
    await env.DB?.prepare(ADD).bind(key, to.userId, to.role, last.text, last.at).run();
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

// The newest unread chats of a person on one side, with their last message (G68, docs/122): the
// sheet «Yangi xabar» of the open Mini App.
export async function lastUnread(env: Bindings, userId: number, role: Role): Promise<UnreadChat[]> {
  return env.DB ? (await env.DB.prepare(LAST).bind(userId, role).all<UnreadChat>()).results : [];
}

// A deleted account (docs/30): its counters go too.
export async function forgetUnread(env: Bindings, userId: number): Promise<void> {
  await env.DB?.prepare(FORGET).bind(userId).run();
}
