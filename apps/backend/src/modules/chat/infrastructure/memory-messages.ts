import type { MessageStore, StoredMessage } from '../application/ports';

// In memory: tests and local runs without Durable Objects.
export function createMemoryMessages(): MessageStore {
  const messages: StoredMessage[] = [];
  const notifiedAt = new Map<number, number>();
  return {
    add: (message) => {
      const stored = { ...message, id: messages.length + 1 };
      messages.push(stored);
      return stored;
    },
    recent: (limit) => messages.slice(-limit),
    maskedCount: (userId) => messages.filter((message) => message.author === userId && message.masked).length,
    lastNotified: (userId) => notifiedAt.get(userId) ?? null,
    notified: (userId, at) => void notifiedAt.set(userId, at),
  };
}
