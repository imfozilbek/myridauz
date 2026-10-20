import { AVATAR_STATUSES, FACE_REASONS } from '@platform/contracts';
import type { UserRepository } from '../application/ports';
import type { FaceCheck } from '../domain/face';
import type { Block, User } from '../domain/user';
import { d1Blocks } from './d1-blocks';
import { d1UserMarks } from './d1-user-marks';
import { oneOf } from '../../../shared/storage/one-of';

type UserRow = {
  id: number;
  public_id: string;
  first_name: string;
  gender: User['gender'];
  phone: string;
  is_driver: number;
  consent_at: number;
  blocked: number;
  blocked_until: number | null;
  avatar_key: string | null;
  avatar_status: string | null;
  avatar_reason: string | null;
  avatar_at: number | null;
  write_access: number;
  created_at: number;
  updated_at: number;
};

const toBlock = (blocked: number, until: number | null): Block | null => (blocked ? { until } : null);

function toFace(row: UserRow): FaceCheck | null {
  const status = oneOf(AVATAR_STATUSES, row.avatar_status);
  if (row.avatar_key === null || status === null) return null;
  return { status, reason: oneOf(FACE_REASONS, row.avatar_reason), at: row.avatar_at ?? row.updated_at };
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  publicId: row.public_id,
  firstName: row.first_name,
  gender: row.gender,
  phone: row.phone,
  locale: 'uz-Latn',
  isDriver: row.is_driver === 1,
  consentAt: row.consent_at,
  block: toBlock(row.blocked, row.blocked_until),
  avatarKey: row.avatar_key,
  face: toFace(row),
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
  byPublicId: async (publicId) => {
    const row = await db
      .prepare('SELECT * FROM users WHERE public_id = ? AND deleted_at IS NULL')
      .bind(publicId)
      .first<UserRow>();
    return row ? toUser(row) : undefined;
  },
  save: async (user) => {
    await db
      .prepare(
        `INSERT INTO users (id, public_id, first_name, gender, phone, locale, is_driver, consent_at, blocked,
           blocked_until, avatar_key, avatar_status, avatar_reason, avatar_at, write_access, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET public_id = excluded.public_id, first_name = excluded.first_name, gender = excluded.gender,
           phone = excluded.phone, is_driver = excluded.is_driver, blocked = excluded.blocked,
           blocked_until = excluded.blocked_until, avatar_key = excluded.avatar_key,
           avatar_status = excluded.avatar_status, avatar_reason = excluded.avatar_reason,
           avatar_at = excluded.avatar_at,
           write_access = excluded.write_access, consent_at = excluded.consent_at,
           updated_at = excluded.updated_at, deleted_at = NULL`,
      )
      .bind(
        user.id,
        user.publicId,
        user.firstName,
        user.gender,
        user.phone,
        user.locale,
        Number(user.isDriver),
        user.consentAt,
        Number(user.block !== null),
        user.block?.until ?? null,
        user.avatarKey,
        user.face?.status ?? null,
        user.face?.reason ?? null,
        user.face?.at ?? null,
        Number(user.writeAccess),
        user.createdAt,
        user.updatedAt,
      )
      .run();
  },
  // The first touch goes with the account: it is tied to the person (G55, docs/116).
  erase: async (id, at) => {
    await db.batch([
      db
        .prepare(
          `UPDATE users SET first_name = '', phone = '', avatar_key = NULL, avatar_status = NULL,
             avatar_reason = NULL, avatar_at = NULL, is_driver = 0, write_access = 0,
             public_id = lower(hex(randomblob(16))), updated_at = ?, deleted_at = ? WHERE id = ?`,
        )
        .bind(at, at, id),
      db.prepare('DELETE FROM user_arrivals WHERE user_id = ?').bind(id),
      // The code of the person goes, and the people they brought are nobody's now (G69).
      db.prepare('DELETE FROM user_codes WHERE user_id = ?').bind(id),
      db.prepare('UPDATE user_arrivals SET inviter_id = NULL WHERE inviter_id = ?').bind(id),
      db.prepare('DELETE FROM share_moments WHERE user_id = ?').bind(id),
    ]);
  },
  // By the index of the status: never every person (G56, docs/117).
  pendingFaces: async () =>
    (
      await db
        .prepare('SELECT * FROM users WHERE avatar_status = ? AND deleted_at IS NULL ORDER BY avatar_at')
        .bind('pending')
        .all<UserRow>()
    ).results.map(toUser),
  ...d1UserMarks(db),
  ...d1Blocks(db),
});
