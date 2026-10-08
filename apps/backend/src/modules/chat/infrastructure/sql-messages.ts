import { CHAT_SYSTEM_EVENTS, type ChatSystemEvent } from '@platform/contracts';
import type { MessageStore, StoredCall, StoredMessage } from '../application/ports';

// SQLite of the chat's Durable Object (docs/07): one database per booking.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author INTEGER NOT NULL,
  text TEXT NOT NULL,
  event TEXT,
  masked INTEGER NOT NULL DEFAULT 0,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notified (user_id INTEGER PRIMARY KEY, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS call_state (id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rings (user_id INTEGER PRIMARY KEY, count INTEGER NOT NULL);`;

type Row = { id: number; author: number; text: string; event: string | null; masked: number; at: number };
const toMessage = (row: Row): StoredMessage => ({
  id: row.id,
  author: row.author,
  text: row.text,
  event: CHAT_SYSTEM_EVENTS.find((event) => event === row.event) ?? null,
  masked: row.masked === 1,
  at: row.at,
});

export function sqlMessages(sql: SqlStorage): MessageStore {
  sql.exec(SCHEMA);
  return {
    add: (message) => {
      const row = sql
        .exec<Row>(
          'INSERT INTO messages (author, text, event, masked, at) VALUES (?, ?, ?, ?, ?) RETURNING *',
          message.author,
          message.text,
          message.event satisfies ChatSystemEvent | null,
          message.masked ? 1 : 0,
          message.at,
        )
        .one();
      return toMessage(row);
    },
    recent: (limit) =>
      sql
        .exec<Row>('SELECT * FROM messages ORDER BY id DESC LIMIT ?', limit)
        .toArray()
        .reverse()
        .map(toMessage),
    maskedCount: (userId) =>
      sql
        .exec<{ n: number }>('SELECT COUNT(*) AS n FROM messages WHERE author = ? AND masked = 1', userId)
        .one().n,
    lastNotified: (userId) =>
      sql.exec<{ at: number }>('SELECT at FROM notified WHERE user_id = ?', userId).toArray()[0]?.at ?? null,
    notified: (userId, at) =>
      void sql.exec(
        'INSERT INTO notified (user_id, at) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET at = excluded.at',
        userId,
        at,
      ),
    // One call at most per chat (docs/08).
    call: () => {
      const body = sql.exec<{ body: string }>('SELECT body FROM call_state WHERE id = 1').toArray()[0]?.body;
      return body ? (JSON.parse(body) as StoredCall) : null;
    },
    saveCall: (call) =>
      void (call
        ? sql.exec(
            'INSERT INTO call_state (id, body) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET body = excluded.body',
            JSON.stringify(call),
          )
        : sql.exec('DELETE FROM call_state')),
    rings: (userId) =>
      sql.exec<{ count: number }>('SELECT count FROM rings WHERE user_id = ?', userId).toArray()[0]?.count ??
      0,
    rang: (userId) =>
      void sql.exec(
        'INSERT INTO rings (user_id, count) VALUES (?, 1) ON CONFLICT (user_id) DO UPDATE SET count = count + 1',
        userId,
      ),
  };
}
