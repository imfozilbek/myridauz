import type { AssignmentStore } from '../application/ports';

// Tables assignments and team_digests (migrations/0030, docs/92).
export const d1Assignments = (db: D1Database): AssignmentStore => ({
  assigneeOf: async (kind, subjectId, day) =>
    (
      await db
        .prepare('SELECT assignee_id FROM assignments WHERE kind = ? AND subject_id = ? AND day = ?')
        .bind(kind, subjectId, day)
        .first<{ assignee_id: number }>()
    )?.assignee_id,
  loads: async (day) => {
    const { results } = await db
      .prepare(
        'SELECT assignee_id, SUM(day = ?) AS today, MAX(assigned_at) AS last_at FROM assignments GROUP BY assignee_id',
      )
      .bind(day)
      .all<{ assignee_id: number; today: number; last_at: number }>();
    return new Map(results.map((row) => [row.assignee_id, { today: row.today, lastAt: row.last_at }]));
  },
  save: async ({ kind, subjectId, day, assigneeId, at, operator }) => {
    await db
      .prepare(
        `INSERT OR REPLACE INTO assignments (kind, subject_id, day, assignee_id, assigned_at, operator_no)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(kind, subjectId, day, assigneeId, at, operator)
      .run();
  },
  operatorOf: async (kind, subjectId) =>
    (
      await db
        .prepare(
          'SELECT operator_no FROM assignments WHERE kind = ? AND subject_id = ? ORDER BY day DESC LIMIT 1',
        )
        .bind(kind, subjectId)
        .first<{ operator_no: number | null }>()
    )?.operator_no ?? undefined,
  answered: async (kind, subjectId, at) => {
    await db
      .prepare(
        `UPDATE assignments SET answered_at = ? WHERE rowid = (SELECT rowid FROM assignments
         WHERE kind = ? AND subject_id = ? AND answered_at IS NULL ORDER BY day DESC LIMIT 1)`,
      )
      .bind(at, kind, subjectId)
      .run();
  },
  supportOf: async (day) => {
    const { results } = await db
      .prepare(
        `SELECT assignee_id, COUNT(*) AS total, COUNT(answered_at) AS answered FROM assignments
         WHERE kind = 'support' AND day = ? GROUP BY assignee_id`,
      )
      .bind(day)
      .all<{ assignee_id: number; total: number; answered: number }>();
    return results.map((row) => ({ assigneeId: row.assignee_id, total: row.total, answered: row.answered }));
  },
  markDigest: async (day, at) => {
    const result = await db
      .prepare('INSERT OR IGNORE INTO team_digests (day, sent_at) VALUES (?, ?)')
      .bind(day, at)
      .run();
    return result.meta.changes > 0;
  },
});
