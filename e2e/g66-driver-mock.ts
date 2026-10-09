import type { Page, Route } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { tashkent } from './g63-after-mock';
import { mapState, mockMap } from './map-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The main screen of a driver as on the mockup g66/2, one to one (lesson 151): Dilnoza with her
// Cobalt, 7 October. Checked: the bonus waits; free: no trip ahead; tomorrow: 3 of 4 seats taken
// and 2 new requests, «Hamyon» for 3 seats; today: 16:00 in 40 minutes with Madina, Sardor, Dilshod.
const [, DRIVER] = MINI_APPS;
const CHILONZOR = '1726294';
export type DriverState = 'pending' | 'free' | 'tomorrow' | 'today';

const dilnoza = {
  id: '00000000000000000000000000000001',
  firstName: 'Dilnoza',
  gender: 'female',
  phone: '+998901110112',
  roles: ['driver'],
  hasAvatar: true,
  writeAccess: true,
  joinedAt: tashkent('2026-08-01T10:00'),
  rating: 4.9,
  avatarStatus: 'approved',
  avatarReason: null,
};
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const photos = { front: true, side: true, interior: true };
const pitak = { id: 'chilonzor', name: 'Chilonzor pitagi', point: { lat: 41.2856, lng: 69.2034 } };

const at = (day: string, time: string) => tashkent(`2026-10-${day}T${time}`);
const done = (id: string, day: string) =>
  tripOf(id, 'Dilnoza', true, 0, { departAt: at(day, '08:00'), status: 'completed', arrivedAt: at(day, '13:00') });
const ahead = (id: string, day: string, time: string) =>
  tripOf(id, 'Dilnoza', true, 0, { departAt: at(day, time), seats: 4, seatsLeft: 1, pitak, price: 90000 });
const seat = (n: string, firstName: string, status: string, trip: object) => ({
  ...confirmed,
  id: `00000000-0000-4000-8000-0000000000${n}`,
  trip,
  status,
  passenger: { id: `000000000000000000000000000000${n}`, firstName, hasAvatar: false },
});

const TRIPS = {
  pending: [],
  free: [done('1', '05'), done('2', '06'), done('3', '07')],
  tomorrow: [done('1', '05'), done('2', '06'), ahead('4', '08', '08:00')],
  today: [done('1', '05'), done('2', '06'), ahead('5', '07', '16:00')],
};
const people = (state: DriverState, trips: readonly { id: string }[]) => {
  const [trip] = trips.slice(-1);
  if (state === 'tomorrow') return [seat('d1', 'Aziz', 'requested', trip), seat('d2', 'Kamola', 'requested', trip)];
  if (state === 'today') return ['Madina', 'Sardor', 'Dilshod'].map((name, n) => seat(`e${n}`, name, 'confirmed', trip));
  return [];
};

const json = (route: Route, body: unknown) => route.fulfill({ json: body });

export async function openDriverHome(page: Page, state: DriverState) {
  await mockApi(page, 'active', state === 'pending' ? 'pending' : 'approved');
  await mockMap(page, mapState());
  const trips = TRIPS[state];
  const status = state === 'pending' ? 'pending' : 'approved';
  await page.route('**/api/me', (route) =>
    route.request().method() === 'GET' ? json(route, { state: 'active', profile: dilnoza }) : route.fallback(),
  );
  await page.route('**/api/driver/application', (route) =>
    json(route, { application: { status, car, photos, reasons: [] } }),
  );
  await page.route('**/api/users/*/avatar', (route) => route.fulfill({ path: 'e2e/fixtures/face.jpg' }));
  await page.route('**/api/passenger/map/where?*', (route) =>
    json(route, { district: CHILONZOR, name: { step: 'mahalla', name: 'Qatortol' }, area: null }),
  );
  await page.route('**/api/driver/trips', (route) => json(route, { trips }));
  await page.route('**/api/driver/bookings', (route) => json(route, { bookings: people(state, trips) }));
  const days = [3, 2].map((count, n) => ({ date: `2026-10-0${7 + n}`, count }));
  await page.route('**/api/driver/requests/board*', (route) =>
    json(route, { known: true, date: '2026-10-07', days, trip: null, fits: [], others: [], carSeats: 4 }),
  );
  await page.route('**/api/driver/wallet', (route) =>
    json(route, {
      bonus: 0,
      main: 0,
      bonusExpiresAt: null,
      seatsLeft: state === 'tomorrow' ? 3 : 14,
      operations: [],
    }),
  );
  // «Siz haydovchisiz!» was seen already: the mockup shows the screen of every day.
  await page.addInitScript(([here]) => {
    localStorage.setItem('here_district', here);
    localStorage.setItem('driver_approval_seen', '1');
  }, [CHILONZOR] as const);
  await page.clock.setFixedTime(state === 'today' ? at('07', '15:20') : at('07', '15:00'));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await page.locator('.home-dock, .driver-day').first().waitFor();
}
