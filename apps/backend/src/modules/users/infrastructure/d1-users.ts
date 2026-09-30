import type { UserRepository } from '../application/ports';
import type { Block, User } from '../domain/user';
import { d1Blocks } from './d1-blocks';

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
    const row = await db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(id)
      .first<UserRow>();
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
           write_access = excluded.write_access, consent_at = excluded.consent_at,
           updated_at = excluded.updated_at, deleted_at = NULL`,
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
  erase: async (id, at) => {
    await db
      .prepare(
        `UPDATE users SET first_name = '', phone = '', avatar_key = NULL, is_driver = 0, write_access = 0,
           updated_at = ?, deleted_at = ? WHERE id = ?`,
      )
      .bind(at, at, id)
      .run();
  },
  ...d1Blocks(db),
});
