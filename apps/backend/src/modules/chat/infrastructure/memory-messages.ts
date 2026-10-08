import type { MessageStore, StoredCall, StoredMessage } from '../application/ports';

// In memory: tests and local runs without Durable Objects.
export function createMemoryMessages(): MessageStore {
  const messages: StoredMessage[] = [];
  const notifiedAt = new Map<number, number>();
  const rang = new Map<number, number>();
  let current: StoredCall | null = null;
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
    call: () => current,
    saveCall: (call) => void (current = call),
    rings: (userId) => rang.get(userId) ?? 0,
    rang: (userId) => void rang.set(userId, (rang.get(userId) ?? 0) + 1),
  };
}
