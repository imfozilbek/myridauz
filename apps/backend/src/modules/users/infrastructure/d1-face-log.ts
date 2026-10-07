import type { FaceDecided } from '../application/ports';

// Table face_log (migrations/0042): every decision of the team on a face photo.
export const d1FaceLog = (db: D1Database) => ({
  add: async (entry: FaceDecided) => {
    await db
      .prepare(
        'INSERT INTO face_log (user_id, status, reason, decided_by, decided_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(entry.userId, entry.status, entry.reason, entry.by, entry.at)
      .run();
  },
});
