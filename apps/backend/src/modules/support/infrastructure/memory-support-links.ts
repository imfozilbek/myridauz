import type { Copy, SupportLinks, Writer } from '../application/support';

type Link = Copy & { readonly writer: Writer; readonly at: number };

// In memory: tests and local runs without D1.
export function createMemorySupportLinks(): SupportLinks {
  const links = new Map<string, Link>();
  return {
    save: async (teamChatId, teamMessageId, writer, at) =>
      void links.set(`${teamChatId}:${teamMessageId}`, { teamChatId, teamMessageId, writer, at }),
    writer: async (teamChatId, teamMessageId) => links.get(`${teamChatId}:${teamMessageId}`)?.writer,
    copies: async (personChatId, since) => {
      const last = new Map<number, number>();
      for (const link of links.values())
        if (link.writer.chatId === personChatId && link.at >= since)
          last.set(link.teamChatId, Math.max(last.get(link.teamChatId) ?? 0, link.teamMessageId));
      return [...last].map(([teamChatId, teamMessageId]) => ({ teamChatId, teamMessageId }));
    },
  };
}
