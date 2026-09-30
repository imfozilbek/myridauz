import type { Page } from '@playwright/test';
import locations from '../apps/backend/seed/locations.json' with { type: 'json' };
import { mockDrivers, type DriverStart } from './drivers-mock';
import { mockBookings } from './bookings-mock';
import { mockChat } from './chat-mock';
import { mockComfort } from './comfort-mock';
import { mockMarket } from './market-mock';

type Me = { state: 'unregistered' | 'active' | 'blocked' };
const settings = { passengerAvatarRequired: false };
const profile = {
  id: 1,
  firstName: 'Dilnoza',
  gender: 'female',
  phone: '+998901234567',
  roles: ['passenger'],
  hasAvatar: false,
  writeAccess: false,
  rating: null,
};

// The backend as the Mini App sees it: registration makes the person active.
export async function mockApi(
  page: Page,
  start: Me['state'] = 'unregistered',
  driver: DriverStart = 'approved',
) {
  let state = start;
  // A driver asked to fix the application already has a face photo.
  let hasAvatar = driver === 'changes';
  const analytics: unknown[] = [];
  const registrations: unknown[] = [];
  const answer = () => {
    if (state === 'blocked') return { state, until: null };
    if (state === 'unregistered') return { state, suggestedName: 'Dilnoza', settings };
    return { state, profile: { ...profile, hasAvatar }, settings };
  };
  await page.route('**/api/analytics', async (route) => {
    analytics.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  await page.route('**/api/me', (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: answer() }),
  );
  await page.route('**/api/me/registration', async (route) => {
    registrations.push(route.request().postDataJSON());
    state = 'active';
    await route.fulfill({ status: 201, json: answer() });
  });
  await page.route('**/api/me/write-access', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/me/avatar', async (route) => {
    hasAvatar = true;
    await route.fulfill({ status: 204 });
  });
  // A test person has no real photo: the profile shows the empty circle.
  await page.route('**/api/users/*/avatar', (route) => route.fulfill({ status: 404, json: {} }));
  // The real directory of the seed (docs/48) in the order of the backend: regions as in docs/14,
  // places inside a region by name.
  const directory = [...locations]
    .sort(
      (a, b) =>
        Number(a.parentId !== null) - Number(b.parentId !== null) ||
        a.position - b.position ||
        (a.name < b.name ? -1 : 1),
    )
    .map((place) => ({ ...place, position: undefined }));
  await page.route('**/api/locations', (route) =>
    route.fulfill({ json: { version: '1', locations: directory } }),
  );
  const drivers = await mockDrivers(page, driver);
  const market = await mockMarket(page);
  const bookings = await mockBookings(page);
  await mockChat(page);
  await mockComfort(page);
  return { analytics, registrations, ...drivers, ...market, ...bookings };
}
