import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { FOUND, mapState, mockMap } from './map-mock';
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
const HOME = FOUND[1]?.point;

async function openWay(page: Page) {
  const state = mapState();
  await mockApi(page, 'active');
  await mockMap(page, state);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(TEXT.findTrip).click();
  // A fills itself where the person stands (docs/71).
  await expect(page.getByText(t('way.here'))).toBeVisible();
  await expect(page.getByText('Qatortol')).toBeVisible();
  return state;
}

// B: the home, found by a search in Cyrillic, the point taken under the pin.
async function chooseHome(page: Page) {
  await page.getByText(t('way.toEmpty')).click();
  await page.getByPlaceholder(t('bookings.map.search')).fill('Регистон');
  await page.getByText('Registon maydoni').click();
  await expect(page.getByRole('status')).toHaveText('Registon maydoni yaqinida');
  await shot(page, '2-home');
  await page.locator('#tg-main-button', { hasText: t('way.point.here') }).click();
}

// Owner check 1: A by the place, a search in Cyrillic, «Uyimdan», B at home, the booking; fixed after.
test('the passenger books from the door to the home, the places stay fixed', async ({ page }) => {
  const state = await openWay(page);
  await drawn(page);
  await shot(page, '1-start');
  await chooseHome(page);
  expect(state.searched).toContain('Регистон');
  await page.getByText(t('way.mode.door')).click();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '3-door');
  await page.locator('#tg-main-button', { hasText: t('way.see') }).click();
  await page.getByText(TEXT.tomorrow).click();
  await page.getByText('Jasur', { exact: false }).first().click();
  await page.getByText(TEXT.book).click();
  await page.getByText(t('market.request.seats', { count: '1' })).click();
  await expect(page.getByText(t('way.book.fixed'))).toBeVisible();
  await shot(page, '4-review');
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(t('bookings.sent.title'))).toBeVisible();
  expect(state.booked).toMatchObject({ seats: 1, mode: 'door', dropoff: HOME });
  expect(state.booked?.pickup).toMatchObject({ lat: 41.3113, lng: 69.2795 });
});

// Owner check 2: «Pitakdan» shows the pitak of the direction.
test('the passenger who goes from a pitak sees the pitak of the direction', async ({ page }) => {
  await openWay(page);
  await chooseHome(page);
  await page.getByText(t('way.mode.pitak')).click();
  await expect(page.getByText(new RegExp(`^${PITAK.name}`, 'u'))).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '5-pitak');
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
  await page.getByText('Jasur').first().click();
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
