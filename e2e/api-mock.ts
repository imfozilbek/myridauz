import type { Page } from '@playwright/test';

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
  return { analytics, registrations };
}
