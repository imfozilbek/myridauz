import type { Page } from '@playwright/test';
import locations from '../apps/backend/seed/locations.json' with { type: 'json' };

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
export async function mockApi(page: Page, start: Me['state'] = 'unregistered') {
  let state = start;
  const analytics: unknown[] = [];
  const registrations: unknown[] = [];
  const answer = () => {
    if (state === 'blocked') return { state, until: null };
    if (state === 'unregistered') return { state, suggestedName: 'Dilnoza', settings };
    return { state, profile, settings };
  };
  await page.route('**/api/analytics', async (route) => {
    analytics.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  await page.route('**/api/me', (route) => route.fulfill({ json: answer() }));
  await page.route('**/api/me/registration', async (route) => {
    registrations.push(route.request().postDataJSON());
    state = 'active';
    await route.fulfill({ status: 201, json: answer() });
  });
  await page.route('**/api/me/write-access', (route) => route.fulfill({ status: 204 }));
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
  return { analytics, registrations };
}
