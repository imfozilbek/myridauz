import type { SupportLinks, Writer } from '../application/support';

// In memory: tests and local runs without D1.
export function createMemorySupportLinks(): SupportLinks {
  const links = new Map<string, Writer>();
  return {
    save: async (teamChatId, teamMessageId, writer) =>
      void links.set(`${teamChatId}:${teamMessageId}`, writer),
    writer: async (teamChatId, teamMessageId) => links.get(`${teamChatId}:${teamMessageId}`),
  };
}
