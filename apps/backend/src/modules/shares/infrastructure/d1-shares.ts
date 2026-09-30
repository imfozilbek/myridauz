import type { ShareRepository } from '../application/ports';
import type { ShareKind, ShareRecord, ShareSubject } from '../domain/share';

// A booking's links live in trip_shares (0009), a driver's trip links in driver_trip_shares (0014).
const TABLES = {
  booking: { shares: 'trip_shares', followers: 'share_followers', id: 'booking_id' },
  trip: { shares: 'driver_trip_shares', followers: 'driver_share_followers', id: 'trip_id' },
} as const satisfies Record<ShareKind, object>;

type Row = { token_hash: string; subject_id: string; created_at: number; revoked_at: number | null };
const toShare = (kind: ShareKind, row: Row): ShareRecord => ({
  tokenHash: row.token_hash,
  subject: { kind, id: row.subject_id },
  createdAt: row.created_at,
  revokedAt: row.revoked_at,
});

export const d1Shares = (db: D1Database): ShareRepository => {
  const findIn = async (kind: ShareKind, tokenHash: string) => {
    const table = TABLES[kind];
    const row = await db
      .prepare(
        `SELECT token_hash, ${table.id} AS subject_id, created_at, revoked_at FROM ${table.shares} WHERE token_hash = ?`,
      )
      .bind(tokenHash)
      .first<Row>();
    return row ? toShare(kind, row) : undefined;
  };
  return {
    save: async ({ tokenHash, subject, createdAt, revokedAt }) => {
      const table = TABLES[subject.kind];
      await db
        .prepare(
          `INSERT INTO ${table.shares} (token_hash, ${table.id}, created_at, revoked_at) VALUES (?, ?, ?, ?)`,
        )
        .bind(tokenHash, subject.id, createdAt, revokedAt)
        .run();
    },
    find: async (tokenHash) => (await findIn('booking', tokenHash)) ?? findIn('trip', tokenHash),
    revoke: async (subject: ShareSubject, at) => {
      const table = TABLES[subject.kind];
      await db.batch([
        db
          .prepare(`UPDATE ${table.shares} SET revoked_at = ? WHERE ${table.id} = ? AND revoked_at IS NULL`)
          .bind(at, subject.id),
        db.prepare(`DELETE FROM ${table.followers} WHERE ${table.id} = ?`).bind(subject.id),
      ]);
    },
    followers: async (subject) => {
      const table = TABLES[subject.kind];
      const rows = await db
        .prepare(`SELECT telegram_id FROM ${table.followers} WHERE ${table.id} = ? ORDER BY created_at`)
        .bind(subject.id)
        .all<{ telegram_id: number }>();
      return rows.results.map((row) => row.telegram_id);
    },
    unfollowAll: async (telegramId) => {
      await db.batch(
        Object.values(TABLES).map((table) =>
          db.prepare(`DELETE FROM ${table.followers} WHERE telegram_id = ?`).bind(telegramId),
        ),
      );
    },
    follow: async (subject, telegramId, at) => {
      const table = TABLES[subject.kind];
      await db
        .prepare(
          `INSERT OR IGNORE INTO ${table.followers} (${table.id}, telegram_id, created_at) VALUES (?, ?, ?)`,
        )
        .bind(subject.id, telegramId, at)
        .run();
    },
  };
};
