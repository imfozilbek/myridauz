import type { PitakChangeRecord, PitakRepository } from '../application/ports';
import type { DirectionRecord, PitakRecord } from '../domain/pitak';

// The same rules as D1 without a database (tests and local runs).
export function createMemoryPitaks(): PitakRepository {
  const pitaks = new Map<string, PitakRecord>();
  const directions = new Map<string, DirectionRecord>();
  const changes: PitakChangeRecord[] = [];
  const key = (from: string, to: string) => `${from}>${to}`;
  return {
    all: async () => [...pitaks.values()],
    find: async (id) => pitaks.get(id),
    save: async (pitak) => void pitaks.set(pitak.id, pitak),
    directions: async () => [...directions.values()],
    direction: async (from, to) => directions.get(key(from, to)),
    saveDirection: async (direction) => void directions.set(key(direction.from, direction.to), direction),
    removeDirection: async (from, to) => directions.delete(key(from, to)),
    log: async (change) => void changes.push(change),
    history: async (limit) => [...changes].reverse().slice(0, limit),
  };
}
