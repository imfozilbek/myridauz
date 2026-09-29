import type { ShareRepository } from '../application/ports';
import type { ShareRecord } from '../domain/share';

type Row = { token_hash: string; booking_id: string; created_at: number; revoked_at: number | null };
const toShare = (row: Row): ShareRecord => ({
  tokenHash: row.token_hash,
  bookingId: row.booking_id,
  createdAt: row.created_at,
  revokedAt: row.revoked_at,
});

// Tables trip_shares and share_followers (migrations/0009_chat_shares.sql).
export const d1Shares = (db: D1Database): ShareRepository => ({
  save: async (share) => {
    await db
      .prepare('INSERT INTO trip_shares (token_hash, booking_id, created_at, revoked_at) VALUES (?, ?, ?, ?)')
      .bind(share.tokenHash, share.bookingId, share.createdAt, share.revokedAt)
      .run();
  },
  find: async (tokenHash) => {
    const row = await db
      .prepare('SELECT * FROM trip_shares WHERE token_hash = ?')
      .bind(tokenHash)
      .first<Row>();
    return row ? toShare(row) : undefined;
  },
  revoke: async (bookingId, at) => {
    await db.batch([
      db
        .prepare('UPDATE trip_shares SET revoked_at = ? WHERE booking_id = ? AND revoked_at IS NULL')
        .bind(at, bookingId),
      db.prepare('DELETE FROM share_followers WHERE booking_id = ?').bind(bookingId),
    ]);
  },
  followers: async (bookingId) =>
    (
      await db
        .prepare('SELECT telegram_id FROM share_followers WHERE booking_id = ? ORDER BY created_at')
        .bind(bookingId)
        .all<{ telegram_id: number }>()
    ).results.map((row) => row.telegram_id),
  follow: async (bookingId, telegramId, at) => {
    await db
      .prepare('INSERT OR IGNORE INTO share_followers (booking_id, telegram_id, created_at) VALUES (?, ?, ?)')
      .bind(bookingId, telegramId, at)
      .run();
  },
});
