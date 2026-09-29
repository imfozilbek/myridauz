import type { UserRepository } from '../application/ports';
import type { Block, User } from '../domain/user';

type UserRow = {
  id: number;
  first_name: string;
  gender: User['gender'];
  phone: string;
  is_driver: number;
  consent_at: number;
  blocked: number;
  blocked_until: number | null;
  avatar_key: string | null;
  write_access: number;
  created_at: number;
  updated_at: number;
};

const toBlock = (blocked: number, until: number | null): Block | null => (blocked ? { until } : null);

const toUser = (row: UserRow): User => ({
  id: row.id,
  firstName: row.first_name,
  gender: row.gender,
  phone: row.phone,
  locale: 'uz-Latn',
  isDriver: row.is_driver === 1,
  consentAt: row.consent_at,
  block: toBlock(row.blocked, row.blocked_until),
  avatarKey: row.avatar_key,
  writeAccess: row.write_access === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Table users (migrations/0002_users.sql).
export const d1Users = (db: D1Database): UserRepository => ({
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
    return row ? toUser(row) : undefined;
  },
  save: async (user) => {
    await db
      .prepare(
        `INSERT INTO users (id, first_name, gender, phone, locale, is_driver, consent_at, blocked,
           blocked_until, avatar_key, write_access, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET first_name = excluded.first_name, gender = excluded.gender,
           phone = excluded.phone, is_driver = excluded.is_driver, blocked = excluded.blocked,
           blocked_until = excluded.blocked_until, avatar_key = excluded.avatar_key,
           write_access = excluded.write_access, updated_at = excluded.updated_at`,
      )
      .bind(
        user.id,
        user.firstName,
        user.gender,
        user.phone,
        user.locale,
        Number(user.isDriver),
        user.consentAt,
        Number(user.block !== null),
        user.block?.until ?? null,
        user.avatarKey,
        Number(user.writeAccess),
        user.createdAt,
        user.updatedAt,
      )
      .run();
  },
  blockPhone: async (phone, block, at) => {
    await db
      .prepare('INSERT OR REPLACE INTO blocked_phones (phone, blocked_until, created_at) VALUES (?, ?, ?)')
      .bind(phone, block.until, at)
      .run();
  },
  phoneBlock: async (phone) => {
    const row = await db
      .prepare('SELECT blocked_until FROM blocked_phones WHERE phone = ?')
      .bind(phone)
      .first<{ blocked_until: number | null }>();
    return row ? { until: row.blocked_until } : null;
  },
});
