import type { Decided, DecisionLog } from '../application/ports';

type Row = {
  user_id: number;
  status: Decided['status'];
  reasons: string;
  decided_by: number;
  decided_at: number;
};

// Table application_log (migrations/0021): every decision of the team, oldest first.
export const d1Decisions = (db: D1Database): DecisionLog => ({
  add: async (entry) => {
    await db
      .prepare(
        'INSERT INTO application_log (user_id, status, reasons, decided_by, decided_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(entry.userId, entry.status, JSON.stringify(entry.reasons), entry.by, entry.at)
      .run();
  },
  of: async (userId) =>
    (
      await db.prepare('SELECT * FROM application_log WHERE user_id = ? ORDER BY id').bind(userId).all<Row>()
    ).results.map((row) => ({
      userId: row.user_id,
      status: row.status,
      reasons: JSON.parse(row.reasons) as string[],
      by: row.decided_by,
      at: row.decided_at,
    })),
  countsBetween: async (from, to) => {
    const { results } = await db
      .prepare(
        'SELECT decided_by, COUNT(*) AS count FROM application_log WHERE decided_at >= ? AND decided_at < ? GROUP BY decided_by',
      )
      .bind(from, to)
      .all<{ decided_by: number; count: number }>();
    return new Map(results.map((row) => [row.decided_by, row.count]));
  },
});
