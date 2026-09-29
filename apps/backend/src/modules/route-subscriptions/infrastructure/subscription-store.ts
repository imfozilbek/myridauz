import type { SubscriptionKind } from '@platform/contracts';
import type { SubscriptionRepository } from '../application/ports';
import type { SubscriptionRecord } from '../domain/subscription';

type Row = {
  id: string;
  user_id: number;
  kind: SubscriptionKind;
  from_id: string;
  to_id: string;
  date: string | null;
  woman: number;
  expires_at: number;
  expired: number;
  last_sent_at: number | null;
  pending: number;
  created_at: number;
};
const toRecord = (row: Row): SubscriptionRecord => ({
  id: row.id,
  userId: row.user_id,
  kind: row.kind,
  from: row.from_id,
  to: row.to_id,
  date: row.date,
  woman: row.woman === 1,
  expiresAt: row.expires_at,
  expired: row.expired === 1,
  lastSentAt: row.last_sent_at,
  pending: row.pending,
  createdAt: row.created_at,
});

// Table route_subscriptions (migrations/0010_channels_subscriptions.sql).
export const d1Subscriptions = (db: D1Database): SubscriptionRepository => {
  const many = async (sql: string, ...values: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...values)
        .all<Row>()
    ).results.map(toRecord);
  return {
    save: async (s) => {
      await db
        .prepare(
          `INSERT OR REPLACE INTO route_subscriptions (id, user_id, kind, from_id, to_id, date, woman,
            expires_at, expired, last_sent_at, pending, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          s.id,
          s.userId,
          s.kind,
          s.from,
          s.to,
          s.date,
          s.woman ? 1 : 0,
          s.expiresAt,
          s.expired ? 1 : 0,
          s.lastSentAt,
          s.pending,
          s.createdAt,
        )
        .run();
    },
    find: async (id) => {
      const row = await db.prepare('SELECT * FROM route_subscriptions WHERE id = ?').bind(id).first<Row>();
      return row ? toRecord(row) : undefined;
    },
    remove: async (id) => {
      await db.prepare('DELETE FROM route_subscriptions WHERE id = ?').bind(id).run();
    },
    byUser: (userId, kind) =>
      many('SELECT * FROM route_subscriptions WHERE user_id = ? AND kind = ?', userId, kind),
    live: (kind, now) =>
      many('SELECT * FROM route_subscriptions WHERE kind = ? AND expired = 0 AND expires_at > ?', kind, now),
    waiting: () => many('SELECT * FROM route_subscriptions WHERE pending > 0'),
    overdue: (now) => many('SELECT * FROM route_subscriptions WHERE expired = 0 AND expires_at <= ?', now),
  };
};

// In memory: tests and local runs without D1.
export function createMemorySubscriptions(): SubscriptionRepository {
  const all = new Map<string, SubscriptionRecord>();
  const list = () => [...all.values()];
  return {
    save: async (subscription) => void all.set(subscription.id, subscription),
    find: async (id) => all.get(id),
    remove: async (id) => void all.delete(id),
    byUser: async (userId, kind) => list().filter((s) => s.userId === userId && s.kind === kind),
    live: async (kind, now) => list().filter((s) => s.kind === kind && !s.expired && s.expiresAt > now),
    waiting: async () => list().filter((s) => s.pending > 0),
    overdue: async (now) => list().filter((s) => !s.expired && s.expiresAt <= now),
  };
}
