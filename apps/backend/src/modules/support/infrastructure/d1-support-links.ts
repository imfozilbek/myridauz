import type { SupportBot, SupportLinks } from '../application/support';

// Table support_links (migrations 0004, 0029).
export const d1SupportLinks = (db: D1Database): SupportLinks => ({
  save: async (teamChatId, teamMessageId, writer, at) => {
    await db
      .prepare(
        `INSERT INTO support_links (team_chat_id, team_message_id, person_chat_id, bot, created_at)
         VALUES (?, ?, ?, ?, ?) ON CONFLICT (team_chat_id, team_message_id) DO NOTHING`,
      )
      .bind(teamChatId, teamMessageId, writer.chatId, writer.bot, at)
      .run();
  },
  writer: async (teamChatId, teamMessageId) => {
    const row = await db
      .prepare('SELECT person_chat_id, bot FROM support_links WHERE team_chat_id = ? AND team_message_id = ?')
      .bind(teamChatId, teamMessageId)
      .first<{ person_chat_id: number; bot: SupportBot }>();
    return row ? { chatId: row.person_chat_id, bot: row.bot } : undefined;
  },
});
