import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, publishButton } from './apps';
import { confirmed } from './bookings-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const mainButton = (page: Page) => page.locator('#tg-main-button');
const json = (page: Page, path: string, body: () => unknown) =>
  page.route(path, (route) => route.fulfill({ json: body() }));

// A narrow Android phone, the most common in Uzbekistan (lesson 52).
const ANDROID = { width: 360, height: 800 };

for (const platform of ['android', 'ios'] as const) {
  test.describe(platform, () => {
    if (platform === 'android') test.use({ viewport: ANDROID });
    scenarios(platform);
  });
}

function scenarios(platform: 'android' | 'ios') {
  const shot = (page: Page, name: string) =>
    page.screenshot({ path: `screenshots/home-${platform}-${name}.png` });

  async function open(page: Page, port: number) {
    const api = await mockApi(page, 'active');
    // No request or offer of a passenger: the block shows the seat of the test (G76, docs/165).
    await json(page, '**/api/passenger/offers', () => ({ offers: [] }));
    await page.route('**/api/passenger/requests', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: { requests: [] } }) : route.fallback(),
    );
    // «Siz haydovchisiz!» was told on an earlier visit (G62).
    await page.addInitScript(() => localStorage.setItem('driver_approval_seen', '1'));
    await mockTelegram(page);
    return { ...api, go: () => page.goto(telegramUrl(appUrl(port), platform)) };
  }

  // Owner check 1: no bookings, the question and «Safar topish»; the search starts at the end.
  test('a passenger without bookings starts the search from the main screen', async ({ page }) => {
    const { go } = await open(page, PASSENGER.port);
    await json(page, '**/api/passenger/bookings', () => ({ bookings: [] }));
    await go();
    await expect(page.getByText(t('way.toEmpty'))).toBeVisible();
    // «Qayerdan» where the person stands, at the bottom (G66, mockup g66/1).
    await expect(page.getByText(t('home.dock.here'))).toBeVisible();
    await expect(mainButton(page)).toHaveText(t('common.passenger.findTrip'));
    await shot(page, '1-passenger-empty');
    await page.getByText(t('way.toEmpty')).click();
    // G59: «Qayerga borasiz?» with the main directions and «Boshqa joy» (docs/118 path 2).
    await expect(page.getByText(t('find.title'))).toBeVisible();
    await expect(page.getByText(t('find.other'))).toBeVisible();
  });

  // Owner check 2: the booking on the main screen changes its status by itself.
  test('a passenger sees the booking change on the main screen', async ({ page }) => {
    const { go, feed } = await open(page, PASSENGER.port);
    let status = 'requested';
    await json(page, '**/api/passenger/bookings', () => ({ bookings: [{ ...confirmed, status }] }));
    await go();
    await expect(page.getByText(new RegExp(t('bookings.status.requested'), 'u'))).toBeVisible();
    await expect.poll(() => feed.sockets.length).toBeGreaterThan(0);
    status = 'confirmed';
    feed.changed();
    await expect(page.getByText(new RegExp(t('bookings.confirmed.title'), 'u'))).toBeVisible();
    await shot(page, '2-passenger-booking');
    await mainButton(page)
      .filter({ hasText: t('home.dock.openTrip') })
      .click();
    await expect(page.locator('.uz-plate').first()).toBeVisible();
  });

  // Owner check 3: the trip and its new requests; a new request comes by itself.
  test('a driver sees the trip and its new requests on the main screen', async ({ page }) => {
    const { go, feed, published, trip } = await open(page, DRIVER.port);
    published.push(trip);
    const request = (id: string) => ({ ...confirmed, id, trip, status: 'requested', plate: null });
    let requests = [request('r1'), request('r2')];
    await json(page, '**/api/driver/bookings', () => ({ bookings: requests }));
    await go();
    const dock = page.getByTestId('home-dock');
    await expect(dock.getByText(t('home.newRequests', { count: '2' }), { exact: false })).toBeVisible();
    await expect.poll(() => feed.sockets.length).toBeGreaterThan(0);
    requests = [...requests, request('r3')];
    feed.changed();
    await expect(dock.getByText(t('home.newRequests', { count: '3' }), { exact: false })).toBeVisible();
    await shot(page, '3-driver-trip');
  });

  // Owner check 4: a driver without trips publishes from the main button at the bottom (G66).
  test('a driver without trips publishes from the main screen', async ({ page }) => {
    const { go } = await open(page, DRIVER.port);
    await go();
    await expect(publishButton(page)).toBeVisible();
    await expect(page.getByText(t('home.dock.toDriver'))).toBeVisible();
    await shot(page, '4-driver-empty');
    await publishButton(page).click();
    await expect(page.getByText(t('places.from'))).toBeVisible();
  });

  // «Qayerga» at the bottom, then the one screen of a new trip opens with the route and the answers
  // of the last trip (G40 K3, G63, G66).
  test('a driver whose trips are over repeats the last trip on one screen (G40, G63)', async ({ page }) => {
    const { go, published } = await open(page, DRIVER.port);
    published.push(tripOf('8', 'Dilnoza', false, -48, { status: 'completed' }));
    await go();
    await expect(page.getByText(t('home.dock.here'))).toBeVisible();
    await page.getByText(t('home.dock.toDriver')).click();
    await page.getByAltText('Samarqand viloyati').click();
    await page.getByText('Samarqand shahri', { exact: true }).click();
    await publishButton(page).click();
    await expect(page.locator('#tg-main-button')).toHaveText(t('market.publish.send'));
    await shot(page, '5-driver-last-trip');
  });
}
