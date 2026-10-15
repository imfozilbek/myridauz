import { loadBrand } from '@platform/brands';
import type { Page } from '@playwright/test';
import locations from '../apps/backend/seed/locations.json' with { type: 'json' };

type Entry = {
  role: 'passenger' | 'driver';
  pains: string[];
  home: string;
  region: string;
  cadence: string;
  waiting: { passengers: number; drivers: number; share: number } | null;
  opened: boolean;
};
type Me = { open: boolean; entries: Entry[]; channels: string[] };

// The backend of the waitlist as the main Mini App sees it (G83, docs/181): what is saved comes back,
// with 124 passengers and 12 drivers on Samarqand like the approved mockups.
export async function mockWaitlist(page: Page, start: Partial<Me> = {}) {
  const { mainChannel, bots } = loadBrand();
  let me: Me = { open: true, entries: [], channels: [`@${mainChannel}`, '-1003906211929'], ...start };
  const waiting = (role: string) => ({ passengers: 124, drivers: 12, share: role === 'driver' ? 0 : 64 });
  await page.route('**/api/analytics', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/locations', (route) => route.fulfill({ json: { version: '1', locations } }));
  await page.route('**/api/waitlist?*', (route) => route.fulfill({ json: me }));
  await page.route('**/api/waitlist', async (route) => {
    if (route.request().method() !== 'PUT') return route.fulfill({ json: me });
    const answers = route.request().postDataJSON() as Omit<Entry, 'waiting' | 'opened'>;
    const entry = { ...answers, waiting: waiting(answers.role), opened: false };
    me = { ...me, entries: [...me.entries.filter((one) => one.role !== answers.role), entry] };
    return route.fulfill({ json: me });
  });
  await page.route('**/api/waitlist/invite', (route) =>
    route.fulfill({ json: { prepared: null, link: `https://t.me/${bots.main}?start=fr-abcdefgh` } }),
  );
}

export const samarqand = (role: Entry['role'], pains: string[], cadence: string, few = false): Entry => ({
  role,
  pains,
  home: '1718',
  region: '1718',
  cadence,
  waiting: few ? null : { passengers: 124, drivers: 12, share: role === 'driver' ? 0 : 64 },
  opened: false,
});
