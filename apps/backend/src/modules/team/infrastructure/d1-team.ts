import type { TeamRepository } from '../application/team';

// Table team_members (migrations/0004_drivers.sql).
export const d1Team = (db: D1Database): TeamRepository => ({
  moderators: async () => {
    const rows = await db
      .prepare('SELECT user_id FROM team_members ORDER BY added_at')
      .all<{ user_id: number }>();
    return rows.results.map((row) => row.user_id);
  },
  add: async (userId, addedBy, at) => {
    await db
      .prepare(
        `INSERT INTO team_members (user_id, role, added_by, added_at) VALUES (?, 'moderator', ?, ?)
         ON CONFLICT (user_id) DO NOTHING`,
      )
      .bind(userId, addedBy, at)
      .run();
  },
  remove: async (userId) => {
    await db.prepare('DELETE FROM team_members WHERE user_id = ?').bind(userId).run();
  },
});
