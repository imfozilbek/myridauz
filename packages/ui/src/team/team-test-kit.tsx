import type { Attention, Navbat, TeamMe, Work } from '@platform/contracts';
import { vi } from 'vitest';
import type { HomeGo } from '../flow/start-action';
import { renderInShell, testClients } from '../test-shell';
import type { Overrides } from '../test-clients-other';
import { TeamHome } from './team-home';

const MINUTE = 60_000;
const NOW = Date.parse('2026-10-12T05:00:00Z');
const pid = (n: number) => String(n).repeat(32).slice(0, 32);

// The queue of the mockup g67/1: a late complaint, two applications, a photo.
export const NAVBAT: Navbat = {
  items: [
    {
      kind: 'complaint',
      id: 'c1',
      name: 'Madina',
      against: 'Jasur',
      reason: 'no_show',
      refund: false,
      since: NOW - 120 * MINUTE,
      minutes: 120,
      late: true,
      takenBy: null,
    },
    {
      kind: 'application',
      id: pid(1),
      name: 'Jasur',
      car: { make: 'Chevrolet', model: 'Cobalt', plate: '01A123BC' },
      since: NOW - 25 * MINUTE,
      minutes: 25,
      late: false,
      takenBy: null,
    },
    {
      kind: 'application',
      id: pid(2),
      name: 'Bobur',
      car: { make: 'Chevrolet', model: 'Nexia', plate: '30B456CA' },
      since: NOW - 12 * MINUTE,
      minutes: 12,
      late: false,
      takenBy: 'Aziz',
    },
    {
      kind: 'face',
      id: pid(3),
      name: 'Madina',
      since: NOW - 10 * MINUTE,
      minutes: 10,
      late: false,
      takenBy: null,
    },
  ],
  counts: { application: 2, complaint: 1, face: 1, support: 0 },
};

const ATTENTION: Attention = {
  signs: [
    { id: 'errors', at: NOW, sign: { kind: 'errors', hour: 9, usual: 1 } },
    { id: 'errors:2', at: NOW, sign: { kind: 'errors', hour: 7, usual: 1 } },
    { id: 'money:1', at: NOW, sign: { kind: 'money', name: 'Jasur', person: pid(1), seats: 2 } },
    { id: 'money:2', at: NOW, sign: { kind: 'money', name: 'Bobur', person: pid(2), seats: 3 } },
    { id: 'money:4', at: NOW, sign: { kind: 'money', name: 'Aziz', person: pid(4), seats: 1 } },
  ],
};

export const WORK: Work = { done: 14, waiting: 4, averageMinutes: 11, over: 0 };

const me = (role: TeamMe['role'], firstName: string): TeamMe => ({
  id: null,
  firstName,
  hasAvatar: false,
  role,
});

export function renderTeamHome(role: TeamMe['role'], overrides: Overrides = {}) {
  const go = vi.fn<HomeGo>();
  const clients = testClients({
    moderation: { me: async () => me(role, role === 'owner' ? 'Fozil' : 'Aziz') },
    team: { navbat: async () => NAVBAT, attention: async () => ATTENTION, work: async () => WORK },
    ...overrides,
  });
  const view = renderInShell(<TeamHome go={go} />, false, true, undefined, clients);
  return { ...view, go };
}
