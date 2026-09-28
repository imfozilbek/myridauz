import type { SupportLinks } from '../application/support';

// In memory: tests and local runs without D1.
export function createMemorySupportLinks(): SupportLinks {
  const links = new Map<string, number>();
  return {
    save: async (teamChatId, teamMessageId, personChatId) =>
      void links.set(`${teamChatId}:${teamMessageId}`, personChatId),
    person: async (teamChatId, teamMessageId) => links.get(`${teamChatId}:${teamMessageId}`),
  };
}
