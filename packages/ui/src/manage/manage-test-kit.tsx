import type { PersonCard } from '@platform/contracts';
import { vi } from 'vitest';
import type { Overrides } from '../test-clients-other';
import { renderInShell, testClients } from '../test-shell';
import { ManagementScreen } from './management-screen';

export const PERSON = 'b'.repeat(32);
export const CARD: PersonCard = {
  id: PERSON,
  firstName: 'Jasur',
  hasAvatar: false,
  joinedAt: Date.parse('2026-08-01T10:00:00Z'),
  rating: { average: 4.8, count: 37 },
  trips: 5,
  rides: 2,
  complaintsAgainst: 1,
  car: { make: 'Chevrolet', model: 'Cobalt', plate: '01A123BC' },
  blocked: false,
  blockedUntil: null,
};
const member = (n: number, firstName: string, role: 'owner' | 'moderator') => ({
  id: String(n).repeat(32),
  firstName,
  hasAvatar: false,
  role,
});
export const MEMBERS = { members: [member(1, 'Fozil', 'owner'), member(2, 'Aziz', 'moderator')] };

// «Boshqaruv» with the live lines of the mockup g67/2 screen 6 (G75).
export function renderManagement(overrides: Overrides = {}) {
  const money = (n: number) => ({
    id: `money:${n}`,
    at: 1,
    sign: { kind: 'money' as const, name: 'Jasur', person: PERSON, seats: 2 },
  });
  const health = (n: number, subscribers: number) => ({
    username: `zone_${n}`,
    title: `zone ${n}`,
    subscribers,
    canPost: true,
    checkedAt: 1,
    failed: 0,
    arrivals: 3,
  });
  const clients = testClients({
    market: { teamTrips: async () => Array.from({ length: 17 }, () => ({}) as never) },
    pitaks: {
      all: async () => ({ pitaks: Array.from({ length: 64 }, () => ({}) as never), directions: [] }),
    },
    ...overrides,
    team: {
      attention: async () => ({ signs: [money(1), money(2), money(3)] }),
      channelHealth: async () => ({ channels: [health(1, 41_000), health(2, 200)] }),
      members: async () => MEMBERS,
      person: vi.fn(async () => CARD),
      ...overrides.team,
    },
  });
  return renderInShell(<ManagementScreen onBack={() => undefined} />, false, true, undefined, clients);
}
