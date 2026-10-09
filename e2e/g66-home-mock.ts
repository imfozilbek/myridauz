import type { Page, Route } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed, offer } from './bookings-mock';
import { tashkent } from './g63-after-mock';
import { mapState, mockMap } from './map-mock';
import { request, tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The main screen of a passenger as on the mockup g66/1, one to one (lesson 151): Madina stands in
// Chilonzor on 7 October at 15:00, her last route went to Samarqand; with a trip she has a seat
// with Jasur tomorrow at 08:00 and her request to Fargʻona on 9 October has 2 offers.
const [PASSENGER] = MINI_APPS;
const CHILONZOR = '1726294';
const SAMARQAND = '1718401';
const FARGONA = '1730401';
const NOW = '2026-10-07T15:00';

const madina = {
  id: '00000000000000000000000000000001',
  firstName: 'Madina',
  gender: 'female',
  phone: '+998901110112',
  roles: ['passenger'],
  hasAvatar: true,
  writeAccess: true,
  joinedAt: tashkent('2026-08-01T10:00'),
  rating: 4.9,
  avatarStatus: 'approved',
  avatarReason: null,
};

const seat = {
  ...confirmed,
  trip: tripOf('1', 'Jasur', false, 0, { departAt: tashkent('2026-10-08T08:00') }),
  createdAt: tashkent('2026-10-07T09:00'),
  confirmedAt: tashkent('2026-10-07T10:00'),
  expiresAt: tashkent('2026-10-08T08:00'),
};
const asked = { ...request, to: FARGONA, date: '2026-10-09' };
const offers = ['c1', 'c2'].map((id, index) => ({
  ...offer,
  id: `00000000-0000-4000-8000-0000000000${id}`,
  requestId: asked.id,
  to: FARGONA,
  departAt: tashkent(`2026-10-09T0${7 + index}:00`),
}));

export type PassengerState = 'quiet' | 'trip';

const json = (route: Route, body: unknown) => route.fulfill({ json: body });

export async function openPassengerHome(page: Page, state: PassengerState = 'quiet') {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  const trip = state === 'trip';
  await page.route('**/api/me', (route) =>
    route.request().method() === 'GET' ? json(route, { state: 'active', profile: madina }) : route.fallback(),
  );
  await page.route('**/api/passenger/bookings', (route) => json(route, { bookings: trip ? [seat] : [] }));
  await page.route('**/api/passenger/requests', (route) =>
    route.request().method() === 'GET' ? json(route, { requests: trip ? [asked] : [] }) : route.fallback(),
  );
  await page.route('**/api/passenger/offers', (route) => json(route, { offers: trip ? offers : [] }));
  // The face of Madina is a real photo: the mockup draws one, the diff skips it (docs/149).
  await page.route('**/api/users/*/avatar', (route) => route.fulfill({ path: 'e2e/fixtures/face.jpg' }));
  // Madina stands in Chilonzor, as on the mockup.
  await page.route('**/api/passenger/map/where?*', (route) =>
    json(route, { district: CHILONZOR, name: { step: 'mahalla', name: 'Qatortol' }, area: null }),
  );
  // «Bugun 3, ertaga 8 ta safar» of the mockup to Samarqand.
  await page.route('**/api/trips/days?*', (route) =>
    json(route, {
      km: 300,
      days: [3, 8, 6, 4, 5, 2, 7].map((trips, index) => ({
        date: `2026-10-${String(7 + index).padStart(2, '0')}`,
        trips,
      })),
    }),
  );
  await page.addInitScript(
    ([here, recent]) => {
      localStorage.setItem('here_district', here);
      localStorage.setItem('route_recent', recent);
    },
    [CHILONZOR, JSON.stringify([{ from: CHILONZOR, to: SAMARQAND }])] as const,
  );
  await page.clock.setFixedTime(tashkent(NOW));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.locator('.home-dock').waitFor();
}
