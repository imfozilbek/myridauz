import { DAY_MS } from '@platform/contracts';
import type { ComplaintsDeps, Ride } from './application/ports';
import { createMemoryComplaints } from './infrastructure/memory-complaints';
import { idOfPublic, publicIdOf } from '../../test-people';

// The complaints of the tests: four rides of one driver, a moderator and the log of what happened.
export const NOW = Date.parse('2026-10-05T12:00:00Z');
export const DRIVER = 1;
export const MODERATOR = 900;
const ride = (n: number): Ride => ({
  bookingId: `b${n}`,
  tripId: 't1',
  driverId: DRIVER,
  passengerId: 100 + n,
  departAt: NOW - DAY_MS,
  endsAt: NOW,
  commission: 9000,
  chatKey: `b${n}`,
});

// A moderator, not the owner: a member of the team is blocked only by the owner (docs/02).
export const BY_MODERATOR = { id: MODERATOR, owner: false };
const TEAM_MEMBER = 102;

export function setup() {
  const rides = [1, 2, 3, 4].map(ride);
  const store = createMemoryComplaints();
  const log: string[] = [];
  const deps: ComplaintsDeps = {
    store,
    ride: async (id) => rides.find((known) => known.bookingId === id),
    filedRide: async (id) => rides.find((known) => known.bookingId === id),
    people: {
      find: async (id) => ({
        publicId: publicIdOf(id),
        firstName: id === DRIVER ? 'Jasur' : `P${id}`,
        avatarKey: null,
      }),
      idOf: idOfPublic,
      block: async (id, days) => void log.push(`block ${id} ${days}`),
      releasePhone: async () => undefined,
      unblock: async (id) => void log.push(`unblock ${id}`),
      blocks: async () => ({ active: null, entries: [] }),
    },
    isTeam: async (id) => id === TEAM_MEMBER,
    trips: async (_id, side) => (side === 'driver' ? 12 : 3),
    chat: async () => [{ author: DRIVER, text: 'Salom', at: NOW }],
    forgetChat: async (key) => void log.push(`forget ${key}`),
    cancelAll: async (id) => void log.push(`cancel ${id}`),
    refund: async (_owner, driverId, bookingId) => {
      log.push(`refund ${driverId} ${bookingId}`);
      return 'ok';
    },
    tell: {
      team: async (complaint) => void log.push(`team ${complaint.reason}`),
      warning: async (id, side) => void log.push(`warning ${id} ${side}`),
      blocked: async (id, side, until) => void log.push(`blocked ${id} ${side} ${until}`),
      resolved: async (id) => void log.push(`resolved ${id}`),
    },
    now: () => NOW,
    newId: () => `c${Math.random()}`,
  };
  return { deps, store, log };
}
export const input = (bookingId: string, reason = 'no_show' as const) => ({ bookingId, reason, comment: '' });
