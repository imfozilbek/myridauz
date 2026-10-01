import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { FOUND, mapState, mockMap, type MapState } from './map-mock';
import { chooseRoute, openOwnTrip } from './market';
import { PITAK } from './market-mock';
import { mockTelegram, telegramEvents, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const shot = (page: Page, name: string) => page.screenshot({ path: `screenshots/way-${name}.png` });
// The map is ready once its first tiles are in; the tiles around come a moment later.
const TILES_MS = 1500;
const drawn = async (page: Page) => {
  await expect(page.locator('[data-state="ready"]').first()).toBeVisible();
  await page.waitForTimeout(TILES_MS);
};
// The point under the pin comes back from the map with a tiny float error.
const [DOOR, HOME] = FOUND.map(({ point }) => ({
  lat: expect.closeTo(point.lat, 5),
  lng: expect.closeTo(point.lng, 5),
}));
const mainButton = (page: Page) => page.locator('#tg-main-button');

// The search by lists (G26, docs/74): a trip of tomorrow to Samarqand shahri, its booking, 1 seat.
async function openBooking(page: Page) {
  const state = mapState();
  await mockApi(page, 'active');
  await mockMap(page, state);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
  await chooseRoute(page);
  await page.getByText(TEXT.tomorrow).click();
  await page.getByText('Jasur', { exact: false }).first().click();
  await page.getByText(TEXT.book).click();
  await page.getByText(t('market.request.seats', { count: '1' })).click();
  return state;
}

// A place found by its name inside the zone of the map; the pin names the place under it.
async function findPlace(page: Page, query: string, name: string, under: string) {
  await page.getByPlaceholder(t('bookings.map.search')).fill(query);
  await page.getByText(name, { exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(under);
}

// The home in Samarqand: the map of the district of the trip, found by a search in Cyrillic.
async function chooseHome(page: Page, state: MapState) {
  await expect(page.getByText(t('way.point.to'))).toBeVisible();
  await drawn(page);
  await findPlace(page, 'Регистон', 'Registon maydoni', 'Registon maydoni yaqinida');
  expect(state.zones[state.searched.indexOf('Регистон')]).toBe('1718401');
  await shot(page, '3-home');
  await mainButton(page)
    .filter({ hasText: t('way.point.here') })
    .click();
}

// Owner check 1: «Uyimdan», the door on the map of the whole city, the home, the check; fixed after.
test('the passenger books from the door to the home inside the zones of the trip', async ({ page }) => {
  const state = await openBooking(page);
  await page.getByText(t('way.mode.door')).click();
  await expect(page.getByText(t('way.point.from'))).toBeVisible();
  await drawn(page);
  await shot(page, '1-door');
  // Farther out: the whole city of Toshkent, the rest shaded; the map does not go beyond it.
  await page.mouse.move(200, 600);
  for (let step = 0; step < 6; step += 1) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(TILES_MS);
  await shot(page, '1-door-city');
  await findPlace(page, 'Mustaqillik', 'Mustaqillik maydoni', 'Qatortol');
  expect(state.zones[state.searched.indexOf('Mustaqillik')]).toBe('1726');
  await page.waitForTimeout(TILES_MS);
  await shot(page, '2-door-found');
  await mainButton(page)
    .filter({ hasText: t('way.point.here') })
    .click();
  await chooseHome(page, state);
  await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
  await expect(page.locator('.pitak-map')).toHaveCount(0);
  await shot(page, '4-review');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.sent.title'))).toBeVisible();
  expect(state.booked).toMatchObject({ seats: 1, mode: 'door', pickup: DOOR, dropoff: HOME });
});

// Owner check 2: «Pitakdan» asks no door; the check shows the pitak of the direction on a map.
test('the passenger who goes from a pitak sees the pitak on the check', async ({ page }) => {
  const state = await openBooking(page);
  await page.getByText(t('way.mode.pitak')).click();
  await chooseHome(page, state);
  await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
  await expect(page.getByText(PITAK.name)).toBeVisible();
  await expect(page.locator('.pitak-map[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '5-pitak');
  await mainButton(page).click();
  await expect(page.getByText(t('bookings.sent.title'))).toBeVisible();
  expect(state.booked).toMatchObject({ seats: 1, mode: 'pitak', pickup: null, dropoff: HOME });
});

// The driver sees the pitak of the direction on a small map before choosing the way (G26).
test('the driver sees the pitak of the direction on the mode step', async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await mainButton(page).filter({ hasText: TEXT.newTrip }).click();
  await chooseRoute(page);
  await expect(page.getByText(t('way.trip.mode.both'))).toBeVisible();
  await expect(page.locator('.pitak-map[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '5-driver-mode');
});

// Owner checks 3 and 4: the requests near the way first; the stops open in the chosen navigator;
// a cancelled booking has no point any more.
test('the driver sees the requests near the way first and opens the route', async ({ page }) => {
  const { published, trip } = await mockApi(page, 'active');
  published.push(trip);
  await mockMap(page, mapState());
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await page.getByText(t('common.myTrips')).click();
  await openOwnTrip(page);
  const headers = page.getByText(new RegExp(`^(${t('way.driver.fits')}|${t('way.driver.others')})$`, 'u'));
  await expect(headers).toHaveText([t('way.driver.fits'), t('way.driver.others')]);
  await expect(page.getByText(/\+3 km/u)).toBeVisible();
  await shot(page, '6-requests');
  await page.getByText(t('way.map.title')).click();
  await drawn(page);
  await expect(page.getByText('Chorsu')).toBeVisible();
  await expect(page.getByText('Sardor')).toBeHidden();
  await shot(page, '7-trip-map');
  await page.locator('#tg-main-button', { hasText: t('way.map.go') }).click();
  await expect.poll(async () => (await telegramEvents(page, 'web_app_open_link')).length).toBe(1);
  const [opened] = await telegramEvents(page, 'web_app_open_link');
  expect(String(opened?.url)).toMatch(/^https:\/\/yandex\.uz\/maps\/\?rtext=~/u);
  await expect(page.getByText(t('way.map.navigatorChange'))).toBeVisible();
  await page.getByText(t('way.map.dropoffs')).click();
  await expect(page.getByText('Registon mahallasi').first()).toBeVisible();
  await shot(page, '8-dropoffs');
});
