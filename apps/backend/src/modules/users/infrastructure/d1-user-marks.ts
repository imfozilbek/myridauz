import { loopOf } from '@platform/contracts';
import type { UserRepository } from '../application/ports';

type Marks = Pick<UserRepository, 'decideFace' | 'arrived' | 'claimZoneInvite'>;

// Single guarded writes on the row of a person in table users (migrations/0002, 0042, 0055).
export const d1UserMarks = (db: D1Database): Marks => ({
  // Only the face columns, only on the waiting photo of that moment (G89 A8, M8).
  decideFace: async (id, face, at) =>
    (
      await db
        .prepare(
          `UPDATE users SET avatar_status = ?, avatar_reason = ? WHERE id = ? AND avatar_status = 'pending'
             AND COALESCE(avatar_at, updated_at) = ?`,
        )
        .bind(face.status, face.reason, id, at)
        .run()
    ).meta.changes === 1,
  // A link a person shared names its author by a short code (G69, docs/123): who brought whom.
  arrived: async (id, { source, via, client }, at) => {
    const code = via ? (loopOf(via)?.code ?? null) : null;
    await db
      .prepare(
        `INSERT OR REPLACE INTO user_arrivals (user_id, source, via, client, arrived_at, inviter_id)
         VALUES (?, ?, ?, ?, ?, (SELECT user_id FROM user_codes WHERE code = ? AND user_id != ?))`,
      )
      .bind(id, source ?? null, via ?? null, client ?? null, at, code, id)
      .run();
  },
  claimZoneInvite: async (id, at) => {
    const { meta } = await db
      .prepare(
        'UPDATE users SET zone_invite_at = ? WHERE id = ? AND zone_invite_at IS NULL AND deleted_at IS NULL',
      )
      .bind(at, id)
      .run();
    return meta.changes > 0;
  },
});
