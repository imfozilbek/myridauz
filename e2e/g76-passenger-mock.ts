import type { Page, Route } from '@playwright/test';
import { mockApi } from './api-mock';
import { confirmed } from './bookings-mock';
import { appUrl, MINI_APPS } from './apps';
import { tashkent } from './g63-after-mock';
import { mapState, mockMap } from './map-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';
import {
  CHILONZOR,
  PASSENGER_SHOTS,
  SAMARQAND,
  TRIP_DAY,
  madina,
  past,
  saved,
  trip,
  type Lists,
} from './g76-passenger-data';

const [PASSENGER] = MINI_APPS;
const json = (route: Route, body: unknown) => route.fulfill({ json: body });

export async function openPassengerShot(page: Page, shot: number) {
  const lists = PASSENGER_SHOTS[shot] as Lists;
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await page.route('**/api/me', (route) =>
    route.request().method() === 'GET'
      ? json(route, {
          state: 'active',
          profile: { ...madina(lists.face ?? true), ...(lists.unrated ? { rating: null } : {}) },
        })
      : route.fallback(),
  );
  // Everyone but the new person of phone 1 has made trips before.
  const made = shot === 1 ? [] : past;
  await page.route('**/api/passenger/bookings', (route) =>
    json(route, { bookings: [...(lists.bookings ?? []), ...made] }),
  );
  await page.route('**/api/passenger/requests', (route) =>
    route.request().method() === 'GET' ? json(route, { requests: lists.requests ?? [] }) : route.fallback(),
  );
  await page.route('**/api/passenger/offers', (route) => json(route, { offers: lists.offers ?? [] }));
  const jasur = trip.driver;
  const akmal = { ...jasur, id: '0000000000000000000000000000002a', firstName: 'Akmal' };
  const aziz = { ...jasur, id: '0000000000000000000000000000002b', firstName: 'Aziz' };
  await page.route('**/api/passenger/favorites', (route) =>
    json(route, { drivers: [jasur, akmal, aziz], trips: lists.favorite ? [saved] : [] }),
  );
  const words = { key: confirmed.chatKey, count: 1, text: 'Yoʻldaman', at: tashkent(TRIP_DAY) };
  const [first] = lists.bookings ?? [];
  const about = { booking: first ?? null, role: 'passenger', request: null, offer: null, driver: null };
  await page.route('**/api/chats/*/about', (route) => json(route, about));
  await page.route('**/api/chats/unread', (route) => json(route, { chats: lists.unread ? [words] : [] }));
  await page.route('**/api/users/*/avatar', (route) => route.fulfill({ path: 'e2e/fixtures/face.jpg' }));
  await page.route('**/api/passenger/map/where?*', (route) =>
    json(route, { district: CHILONZOR, name: { step: 'mahalla', name: 'Qatortol' }, area: null }),
  );
  await page.route('**/api/trips/days?*', (route) =>
    json(route, {
      km: 300,
      days: [3, 8, 6, 4, 5, 2, 7].map((trips, index) => ({
        date: `2026-10-${String(7 + index).padStart(2, '0')}`,
        trips,
      })),
      places: [],
    }),
  );
  await page.addInitScript(
    ([here, recent]) => {
      localStorage.setItem('here_district', here);
      if (recent) localStorage.setItem('route_recent', recent);
    },
    [CHILONZOR, lists.recent ? JSON.stringify([{ from: CHILONZOR, to: SAMARQAND }]) : ''] as const,
  );
  await page.clock.setFixedTime(tashkent(lists.now));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.locator('.home-dock').waitFor();
}
