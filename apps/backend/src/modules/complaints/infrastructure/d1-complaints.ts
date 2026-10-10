import type { ComplaintStore } from '../application/ports';
import { allIn } from '../../../shared/storage/in-list';
import { REFUND_COLUMNS, reasonsText, refundValues, toComplaint, type Row } from './complaint-row';

const COLUMNS = [
  'id',
  'author_id',
  'against_id',
  'booking_id',
  'reason',
  'comment',
  'status',
  'decision',
  'decided_by',
  'created_at',
  'decided_at',
  ...REFUND_COLUMNS,
] as const;
const SAVE = `INSERT OR REPLACE INTO complaints (${COLUMNS.join(', ')})
  VALUES (${COLUMNS.map(() => '?').join(', ')})`;
// The decision and a proposed refund are written in one step, once (docs/65 A4).
const RESOLVE = `UPDATE complaints SET status = 'resolved', decision = ?, decided_by = ?, decided_at = ?,
  ${REFUND_COLUMNS.map((column) => `${column} = ?`).join(', ')} WHERE id = ? AND status != 'resolved'`;
// The owner answers a proposed refund once: a second tap changes nothing (G63).
const ANSWER = `UPDATE complaints SET refund_state = ?, refund_decided_by = ?, refund_decided_at = ?
  WHERE id = ? AND refund_state = ?`;

// Tables complaints and complaint_chat_reads (migrations/0012_ratings_complaints.sql).
export const d1Complaints = (db: D1Database): ComplaintStore => ({
  save: async (c) => {
    const { id, authorId, againstId, bookingId, reasons, comment, status } = c;
    const decided = [c.decision, c.decidedBy, c.createdAt, c.decidedAt] as const;
    const values = [id, authorId, againstId, bookingId, reasonsText(reasons), comment, status, ...decided];
    await db
      .prepare(SAVE)
      .bind(...values, ...refundValues(c))
      .run();
  },
  resolve: async (c) => {
    const values = [c.decision, c.decidedBy, c.decidedAt, ...refundValues(c), c.id];
    return (
      (
        await db
          .prepare(RESOLVE)
          .bind(...values)
          .run()
      ).meta.changes === 1
    );
  },
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').bind(id).first<Row>();
    return row ? toComplaint(row) : undefined;
  },
  ofAuthor: async (authorId, bookingId) => {
    const sql = 'SELECT * FROM complaints WHERE author_id = ? AND booking_id = ?';
    const row = await db.prepare(sql).bind(authorId, bookingId).first<Row>();
    return row ? toComplaint(row) : undefined;
  },
  open: async () =>
    (
      await db.prepare("SELECT * FROM complaints WHERE status IN ('new', 'in_review')").all<Row>()
    ).results.map(toComplaint),
  against: async (ids, since) => {
    const sql = (marks: string) =>
      `SELECT * FROM complaints WHERE created_at >= ? AND against_id IN (${marks})`;
    return (await allIn<Row>(db, sql, ids, [since])).map(toComplaint);
  },
  countAgainst: async (userId) => {
    const sql = 'SELECT COUNT(*) AS count FROM complaints WHERE against_id = ?';
    return (await db.prepare(sql).bind(userId).first<{ count: number }>())?.count ?? 0;
  },
  logChatRead: async (complaintId, moderatorId, at) => {
    const sql = 'INSERT INTO complaint_chat_reads (complaint_id, moderator_id, at) VALUES (?, ?, ?)';
    await db.prepare(sql).bind(complaintId, moderatorId, at).run();
  },
  refundsProposed: async () =>
    (await db.prepare("SELECT * FROM complaints WHERE refund_state = 'proposed'").all<Row>()).results.map(
      toComplaint,
    ),
  ofAuthorRides: async (authorId, bookingIds) => {
    const sql = (marks: string) =>
      `SELECT * FROM complaints WHERE author_id = ? AND booking_id IN (${marks})`;
    return (await allIn<Row>(db, sql, bookingIds, [authorId])).map(toComplaint);
  },
  answerRefund: async ({ id, refund }, expected) => {
    const values = [
      refund?.state ?? null,
      refund?.decidedBy ?? null,
      refund?.decidedAt ?? null,
      id,
      expected,
    ];
    return (
      (
        await db
          .prepare(ANSWER)
          .bind(...values)
          .run()
      ).meta.changes === 1
    );
  },
});
