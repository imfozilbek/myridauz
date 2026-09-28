import type { SupportLinks } from '../application/support';

// Table support_links (migrations/0004_drivers.sql).
export const d1SupportLinks = (db: D1Database): SupportLinks => ({
  save: async (teamChatId, teamMessageId, personChatId, at) => {
    await db
      .prepare(
        `INSERT INTO support_links (team_chat_id, team_message_id, person_chat_id, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (team_chat_id, team_message_id) DO NOTHING`,
      )
      .bind(teamChatId, teamMessageId, personChatId, at)
      .run();
  },
  person: async (teamChatId, teamMessageId) => {
    const row = await db
      .prepare('SELECT person_chat_id FROM support_links WHERE team_chat_id = ? AND team_message_id = ?')
      .bind(teamChatId, teamMessageId)
      .first<{ person_chat_id: number }>();
    return row?.person_chat_id;
  },
});
