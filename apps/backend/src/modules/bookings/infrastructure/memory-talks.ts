import type { TalkRepository } from '../application/offer-ports';
import type { TalkRecord } from '../domain/talk';

// The same rules as D1 without a database (tests and local runs): one talk per request and driver.
export function createMemoryTalks(): TalkRepository {
  const rows = new Map<string, TalkRecord>();
  const list = () => [...rows.values()];
  return {
    open: async (talk) => {
      const known = list().find((row) => row.requestId === talk.requestId && row.driverId === talk.driverId);
      if (known) return known;
      rows.set(talk.id, talk);
      return talk;
    },
    find: async (id) => rows.get(id),
    byDriver: async (driverId) => list().filter((talk) => talk.driverId === driverId),
    byRequests: async (requestIds) => list().filter((talk) => requestIds.includes(talk.requestId)),
  };
}
