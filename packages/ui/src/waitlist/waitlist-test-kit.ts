import type { LocationsClient } from '@platform/api-client';
import {
  WAITLIST_REGIONS,
  type WaitlistAnswers,
  type WaitlistEntry,
  type WaitlistMe,
} from '@platform/contracts';
import { testClients } from '../test-clients';

const NAMES: Readonly<Record<string, string>> = {
  '1726': 'Toshkent shahri',
  '1718': 'Samarqand viloyati',
  '1703': 'Andijon viloyati',
};
// The 14 regions of the directory: the tests read three of them by their names.
export const waitlistPlaces: LocationsClient = {
  getLocations: async () => ({
    version: '1',
    locations: WAITLIST_REGIONS.map((id) => ({
      id,
      parentId: null,
      type: 'region' as const,
      name: NAMES[id] ?? `Viloyat ${id}`,
      lat: 41,
      lng: 69,
      oneCity: id === '1726',
    })),
  }),
};

export const entryOf = (answers: WaitlistAnswers, overrides: Partial<WaitlistEntry> = {}): WaitlistEntry => ({
  ...answers,
  waiting: null,
  opened: false,
  ...overrides,
});

// The client of the list of one person: what is saved comes back, the invitations are counted.
export function waitlistClients(start: Partial<WaitlistMe> = {}) {
  let me: WaitlistMe = { open: true, entries: [], channels: [], ...start };
  const saved: WaitlistAnswers[] = [];
  const invited: string[] = [];
  const clients = testClients({
    waitlist: {
      open: async () => me,
      save: async (answers) => {
        saved.push(answers);
        const rest = me.entries.filter((entry) => entry.role !== answers.role);
        me = { ...me, entries: [...rest, entryOf(answers)] };
        return me;
      },
      invite: async (role) => {
        invited.push(role);
        return { prepared: null, link: 'https://t.me/main_bot?start=fr-abcdefgh' };
      },
    },
  });
  return { clients, saved, invited };
}
