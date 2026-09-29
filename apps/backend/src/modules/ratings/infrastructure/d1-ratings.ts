import type { Ask, RatingStore } from '../application/ports';
import type { StoredReview } from '../domain/rating';

type ReviewRow = {
  id: string;
  booking_id: string;
  rater_id: number;
  ratee_id: number;
  stars: number;
  tags: string;
  text: string;
  hidden: number;
  created_at: number;
  updated_at: number;
};
type AskRow = { booking_id: string; rater_id: number; ratee_id: number; asked_at: number };

const toReview = (row: ReviewRow): StoredReview => ({
  id: row.id,
  bookingId: row.booking_id,
  raterId: row.rater_id,
  rateeId: row.ratee_id,
  stars: row.stars,
  tags: JSON.parse(row.tags) as string[],
  text: row.text,
  hidden: row.hidden === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const toAsk = (row: AskRow): Ask => ({
  bookingId: row.booking_id,
  raterId: row.rater_id,
  rateeId: row.ratee_id,
  askedAt: row.asked_at,
});
const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');

// Tables rating_asks, reviews and rating_flags (migrations/0012_ratings_complaints.sql).
export const d1Ratings = (db: D1Database): RatingStore => ({
  askedBookings: async (ids) => {
    if (ids.length === 0) return new Set();
    const sql = `SELECT DISTINCT booking_id FROM rating_asks WHERE booking_id IN (${marks(ids.length)})`;
    const { results } = await db
      .prepare(sql)
      .bind(...ids)
      .all<{ booking_id: string }>();
    return new Set(results.map((row) => row.booking_id));
  },
  saveAsks: async (asks) => {
    const insert = db.prepare(
      'INSERT OR IGNORE INTO rating_asks (booking_id, rater_id, ratee_id, asked_at) VALUES (?, ?, ?, ?)',
    );
    await db.batch(asks.map((ask) => insert.bind(ask.bookingId, ask.raterId, ask.rateeId, ask.askedAt)));
  },
  toRemind: async (before, after) => {
    const sql =
      'SELECT a.* FROM rating_asks a WHERE a.reminded = 0 AND a.asked_at <= ? AND a.asked_at > ? ' +
      'AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = a.booking_id AND r.rater_id = a.rater_id)';
    return (await db.prepare(sql).bind(before, after).all<AskRow>()).results.map(toAsk);
  },
  markReminded: async (ask) => {
    await db
      .prepare('UPDATE rating_asks SET reminded = 1 WHERE booking_id = ? AND rater_id = ?')
      .bind(ask.bookingId, ask.raterId)
      .run();
  },
  review: async (bookingId, raterId) => {
    const sql = 'SELECT * FROM reviews WHERE booking_id = ? AND rater_id = ?';
    const row = await db.prepare(sql).bind(bookingId, raterId).first<ReviewRow>();
    return row ? toReview(row) : undefined;
  },
  saveReview: async (r) => {
    await db
      .prepare(
        'INSERT OR REPLACE INTO reviews (id, booking_id, rater_id, ratee_id, stars, tags, text, hidden, ' +
          'created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        r.id,
        r.bookingId,
        r.raterId,
        r.rateeId,
        r.stars,
        JSON.stringify(r.tags),
        r.text,
        r.hidden ? 1 : 0,
        r.createdAt,
        r.updatedAt,
      )
      .run();
  },
  about: async (ids) => {
    if (ids.length === 0) return [];
    const sql = `SELECT * FROM reviews WHERE ratee_id IN (${marks(ids.length)})`;
    return (
      await db
        .prepare(sql)
        .bind(...ids)
        .all<ReviewRow>()
    ).results.map(toReview);
  },
  writtenBy: async (ids) => {
    if (ids.length === 0) return new Set();
    const sql = `SELECT booking_id, rater_id FROM reviews WHERE rater_id IN (${marks(ids.length)})`;
    const { results } = await db
      .prepare(sql)
      .bind(...ids)
      .all<{ booking_id: string; rater_id: number }>();
    return new Set(results.map((row) => `${row.booking_id}:${row.rater_id}`));
  },
  hide: async (id) => {
    const result = await db.prepare('UPDATE reviews SET hidden = 1 WHERE id = ?').bind(id).run();
    return result.meta.changes > 0;
  },
  flag: async (userId, at) => {
    const sql = 'INSERT OR IGNORE INTO rating_flags (user_id, flagged_at) VALUES (?, ?)';
    const result = await db.prepare(sql).bind(userId, at).run();
    return result.meta.changes > 0;
  },
});
