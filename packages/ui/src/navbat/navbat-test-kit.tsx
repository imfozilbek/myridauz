import type { ApplicationDetail, Complaint, Navbat, NavbatItem } from '@platform/contracts';
import { vi } from 'vitest';
import type { NavbatOpen } from '../flow/start-action';
import type { Overrides } from '../test-clients-other';
import { renderInShell, testClients } from '../test-shell';
import { NavbatScreen } from './navbat-screen';

const pid = (n: number) => String(n).repeat(32).slice(0, 32);
const base = { since: 0, minutes: 12, late: false, takenBy: null };
const car = { make: 'Chevrolet', model: 'Cobalt', plate: '01A123BC' };
export const JASUR: NavbatItem = { kind: 'application', id: pid(1), name: 'Jasur', car, ...base };
export const BOBUR: NavbatItem = { kind: 'application', id: pid(2), name: 'Bobur', car, ...base };
export const MADINA: NavbatItem = { kind: 'face', id: pid(3), name: 'Madina', ...base, minutes: 10 };
export const COMPLAINT: NavbatItem = {
  kind: 'complaint',
  id: 'c1',
  name: 'Madina',
  against: 'Jasur',
  reasons: ['no_show'],
  refund: false,
  ...base,
};
export const KAMOLA: NavbatItem = { kind: 'support', id: pid(4), name: 'Kamola', appeal: true, ...base };

const navbatOf = (items: NavbatItem[]): Navbat => ({
  items,
  counts: {
    application: items.filter((item) => item.kind === 'application').length,
    complaint: items.filter((item) => item.kind === 'complaint').length,
    face: items.filter((item) => item.kind === 'face').length,
    support: items.filter((item) => item.kind === 'support').length,
  },
});

export const detailOf = (item: NavbatItem): ApplicationDetail => ({
  userId: item.id,
  firstName: item.name,
  status: 'pending',
  car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
  reasons: [],
  submittedAt: 1,
  history: [],
  samePlate: 1,
  was: null,
  gender: 'male',
});

const party = (id: string, firstName: string, role: 'driver' | 'passenger') => ({
  id,
  firstName,
  hasAvatar: false,
  role,
  trips: 3,
  complaints: 0,
});
export const COMPLAINT_DETAIL: Complaint = {
  id: 'c1',
  reasons: ['no_show'],
  high: false,
  comment: 'Haydovchi kelmadi, telefonni olmadi.',
  status: 'new',
  // Two hours before the clock of the tests (dom-test-setup).
  createdAt: Date.parse('2026-10-01T10:00:00Z'),
  tripId: 't1',
  departAt: 1,
  author: party(pid(3), 'Madina', 'passenger'),
  against: party(pid(1), 'Jasur', 'driver'),
  refund: null,
};

// «Navbat» opened at a case with the given queue; every client the cases use is a spy.
export function renderNavbat(open: NavbatOpen | undefined, items: NavbatItem[], overrides: Overrides = {}) {
  const queue = { current: navbatOf(items) };
  const take = vi.fn(async () => undefined);
  const decide = vi.fn(async () => {
    queue.current = navbatOf(queue.current.items.slice(1));
    return { ...detailOf(JASUR), status: 'rejected' as const };
  });
  const clients = testClients({
    team: { navbat: async () => queue.current, take, ...overrides.team },
    moderation: {
      get: async (id: string) => detailOf(items.find((item) => item.id === id) ?? JASUR),
      photo: async () => new Blob(['x']),
      decide,
      ...overrides.moderation,
    },
    ...(overrides.feedback ? { feedback: overrides.feedback } : {}),
  });
  const view = renderInShell(
    <NavbatScreen onBack={() => undefined} {...(open ? { navbat: open } : {})} />,
    false,
    true,
    undefined,
    clients,
  );
  return { ...view, take, decide, queue };
}
