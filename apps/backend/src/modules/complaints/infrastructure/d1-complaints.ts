import type { ComplaintReason, ComplaintStatus } from '@platform/contracts';
import type { ComplaintStore } from '../application/ports';
import type { ComplaintRecord } from '../domain/complaint';
import { allIn } from '../../../shared/storage/in-list';

type Row = {
  id: string;
  author_id: number;
  against_id: number;
  booking_id: string;
  reason: string;
  comment: string;
  status: string;
  decision: string | null;
  decided_by: number | null;
  created_at: number;
  decided_at: number | null;
};

const toComplaint = (row: Row): ComplaintRecord => ({
  id: row.id,
  authorId: row.author_id,
  againstId: row.against_id,
  bookingId: row.booking_id,
  reason: row.reason as ComplaintReason,
  comment: row.comment,
  status: row.status as ComplaintStatus,
  decision: row.decision,
  decidedBy: row.decided_by,
  createdAt: row.created_at,
  decidedAt: row.decided_at,
});

// Tables complaints and complaint_chat_reads (migrations/0012_ratings_complaints.sql).
export const d1Complaints = (db: D1Database): ComplaintStore => ({
  save: async (c) => {
    await db
      .prepare(
        'INSERT OR REPLACE INTO complaints (id, author_id, against_id, booking_id, reason, comment, status, ' +
          'decision, decided_by, created_at, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        c.id,
        c.authorId,
        c.againstId,
        c.bookingId,
        c.reason,
        c.comment,
        c.status,
        c.decision,
        c.decidedBy,
        c.createdAt,
        c.decidedAt,
      )
      .run();
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
    (await db.prepare("SELECT * FROM complaints WHERE status != 'resolved'").all<Row>()).results.map(
      toComplaint,
    ),
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
});
