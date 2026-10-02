import type { HistoryEntry, SupportHistory } from '../application/history';

type Row = {
  person_id: number;
  at: number;
  author: HistoryEntry['author'];
  name: string;
  kind: HistoryEntry['kind'];
  text: string;
};

// Table support_messages (migrations/0032, G32).
export const d1History = (db: D1Database): SupportHistory => ({
  add: async ({ personId, at, author, name, kind, text }) => {
    await db
      .prepare(
        'INSERT INTO support_messages (person_id, at, author, name, kind, text) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(personId, at, author, name, kind, text)
      .run();
  },
  of: async (personId) =>
    (
      await db
        .prepare('SELECT * FROM support_messages WHERE person_id = ? ORDER BY at')
        .bind(personId)
        .all<Row>()
    ).results.map((row) => ({
      personId: row.person_id,
      at: row.at,
      author: row.author,
      name: row.name,
      kind: row.kind,
      text: row.text,
    })),
  forget: async (personId) => {
    await db.prepare('DELETE FROM support_messages WHERE person_id = ?').bind(personId).run();
  },
  purge: async (before) => {
    await db.prepare('DELETE FROM support_messages WHERE at < ?').bind(before).run();
  },
});
