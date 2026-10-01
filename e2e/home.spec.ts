import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const shot = (page: Page, name: string) => page.screenshot({ path: `screenshots/home-${name}.png` });
const mainButton = (page: Page) => page.locator('#tg-main-button');
const json = (page: Page, path: string, body: () => unknown) =>
  page.route(path, (route) => route.fulfill({ json: body() }));

async function open(page: Page, port: number) {
  const api = await mockApi(page, 'active');
  await mockTelegram(page);
  return { ...api, go: () => page.goto(telegramUrl(appUrl(port))) };
}

// Owner check 1: no bookings, the question and «Safar topish»; the search starts at the end.
test('a passenger without bookings starts the search from the main screen', async ({ page }) => {
  const { go } = await open(page, PASSENGER.port);
  await json(page, '**/api/passenger/bookings', () => ({ bookings: [] }));
  await go();
  await expect(page.getByText(t('way.toEmpty'))).toBeVisible();
  await expect(page.getByText(t('way.here'))).toBeVisible();
  await expect(mainButton(page)).toHaveText(t('common.passenger.findTrip'));
  await shot(page, '1-passenger-empty');
  await page.getByText(t('way.toEmpty')).click();
  await expect(page.getByText(t('way.point.to'))).toBeVisible();
});

// Owner check 2: the booking on the main screen changes its status by itself.
test('a passenger sees the booking change on the main screen', async ({ page }) => {
  const { go, feed } = await open(page, PASSENGER.port);
  let status = 'requested';
  await json(page, '**/api/passenger/bookings', () => ({ bookings: [{ ...confirmed, status }] }));
  await go();
  await expect(page.getByText(t('home.title'))).toBeVisible();
  await expect(page.getByText(new RegExp(t('bookings.status.requested'), 'u'))).toBeVisible();
  await expect.poll(() => feed.sockets.length).toBeGreaterThan(0);
  status = 'confirmed';
  feed.changed();
  await expect(page.getByText(new RegExp(t('bookings.status.confirmed'), 'u'))).toBeVisible();
  await shot(page, '2-passenger-booking');
  await page.getByText(/→/u).first().click();
  await expect(page.getByText(t('bookings.plate'))).toBeVisible();
});

// Owner check 3: the trip and its new requests; a new request comes by itself.
test('a driver sees the trip and its new requests on the main screen', async ({ page }) => {
  const { go, feed, published, trip } = await open(page, DRIVER.port);
  published.push(trip);
  const request = (id: string) => ({ ...confirmed, id, trip, status: 'requested', plate: null });
  let requests = [request('r1'), request('r2')];
  await json(page, '**/api/driver/bookings', () => ({ bookings: requests }));
  await go();
  await expect(page.getByText(t('home.requests', { count: '2' }), { exact: false })).toBeVisible();
  await expect.poll(() => feed.sockets.length).toBeGreaterThan(0);
  requests = [...requests, request('r3')];
  feed.changed();
  await expect(page.getByText(t('home.requests', { count: '3' }), { exact: false })).toBeVisible();
  await shot(page, '3-driver-trip');
});

// Owner check 4: a new driver publishes from the main screen; a driver who drove gets the last route.
test('a driver without trips publishes from the main screen', async ({ page }) => {
  const { go } = await open(page, DRIVER.port);
  await go();
  await expect(page.getByText(t('home.driver.question'))).toBeVisible();
  await expect(mainButton(page)).toHaveText(t('home.publish'));
  await shot(page, '4-driver-empty');
  await mainButton(page).click();
  await expect(page.getByText(t('places.from'))).toBeVisible();
});

test('a driver whose trips are over repeats the last route in one tap', async ({ page }) => {
  const { go, published } = await open(page, DRIVER.port);
  published.push(tripOf('8', 'Dilnoza', false, -48, { status: 'completed' }));
  await go();
  await expect(page.getByText(t('home.driver.last'))).toBeVisible();
  await shot(page, '5-driver-last-route');
  await page.getByText(t('home.driver.last')).click();
  await expect(page.getByText(t('way.trip.mode.title'))).toBeVisible();
});
