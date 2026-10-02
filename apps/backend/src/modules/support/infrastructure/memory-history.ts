import type { HistoryEntry, SupportHistory } from '../application/history';

// In memory: tests and local runs without D1.
export function createMemoryHistory(): SupportHistory {
  let entries: HistoryEntry[] = [];
  return {
    add: async (entry) => void entries.push(entry),
    of: async (personId) => entries.filter((entry) => entry.personId === personId),
    forget: async (personId) => void (entries = entries.filter((entry) => entry.personId !== personId)),
    purge: async (before) => void (entries = entries.filter((entry) => entry.at >= before)),
  };
}
