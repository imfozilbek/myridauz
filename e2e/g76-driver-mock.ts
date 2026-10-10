import type { Page, Route } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { tashkent } from './g63-after-mock';
import { mapState, mockMap } from './map-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';
import { CHILONZOR, DAY, DRIVER_SHOTS, SAMARQAND, at, plenty, type Shot } from './g76-driver-data';

const [, DRIVER] = MINI_APPS;
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
const json = (route: Route, body: unknown) => route.fulfill({ json: body });

export async function openDriverShot(page: Page, shot: number) {
  const lists = DRIVER_SHOTS[shot] as Shot;
  const status = lists.status ?? 'approved';
  await mockApi(page, 'active', status === 'approved' ? 'approved' : 'pending');
  await mockMap(page, mapState());
  await page.route('**/api/me', (route) =>
    route.request().method() === 'GET'
      ? json(route, { state: 'active', profile: dilnoza })
      : route.fallback(),
  );
  const reasons = status === 'changes_requested' ? ['plate_not_readable'] : [];
  await page.route('**/api/driver/application', (route) =>
    json(route, { application: status === 'draft' ? null : { status, car, photos, reasons } }),
  );
  await page.route('**/api/users/*/avatar', (route) => route.fulfill({ path: 'e2e/fixtures/face.jpg' }));
  await page.route('**/api/passenger/map/where?*', (route) =>
    json(route, { district: CHILONZOR, name: { step: 'mahalla', name: 'Qatortol' }, area: null }),
  );
  await page.route('**/api/driver/trips', (route) => json(route, { trips: lists.trips ?? [] }));
  await page.route('**/api/driver/bookings', (route) => json(route, { bookings: lists.bookings ?? [] }));
  const days = [3, 2].map((count, n) => ({ date: `2026-10-0${7 + n}`, count }));
  await page.route('**/api/driver/requests/board*', (route) =>
    json(route, { known: true, date: '2026-10-07', days, trip: null, fits: [], others: [], carSeats: 4 }),
  );
  const wallet = lists.wallet ?? plenty;
  await page.route('**/api/driver/wallet', (route) =>
    json(route, { ...wallet, bonusExpiresAt: tashkent('2026-11-12T23:59'), operations: [] }),
  );
  const words = {
    key: `b00000000-0000-4000-8000-0000000000${lists.unread}`,
    count: 1,
    text: 'Keldim',
    at: at('07T15:44'),
  };
  await page.route('**/api/chats/unread', (route) => json(route, { chats: lists.unread ? [words] : [] }));
  await page.addInitScript(
    ([here, welcome, recent]) => {
      localStorage.setItem('here_district', here);
      if (!welcome) localStorage.setItem('driver_approval_seen', '1');
      if (recent) localStorage.setItem('route_recent', recent);
    },
    [
      CHILONZOR,
      lists.welcome === true,
      lists.recent ? JSON.stringify([{ from: CHILONZOR, to: SAMARQAND }]) : '',
    ] as const,
  );
  await page.clock.setFixedTime(lists.now === DAY ? tashkent(DAY) : at(lists.now));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  // A fix opens the application first (G62); «Orqaga» leaves it for the main screen.
  if (status === 'changes_requested') {
    await page.getByText('Bitta rasmni almashtiring').waitFor();
    await pressBack(page);
  }
  await page.locator('.home-dock').waitFor();
}
