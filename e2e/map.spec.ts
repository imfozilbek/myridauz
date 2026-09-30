import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { FOUND, mapState, mockMap } from './map-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const shot = (page: Page, name: string) => page.screenshot({ path: `screenshots/map-${name}.png` });
// The map is ready once its first tiles are in; the tiles around come a moment later.
const TILES_MS = 1500;
const drawn = async (page: Page) => {
  await expect(page.locator('.pickup-map-box[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
};

// G22: the passenger puts the pin on the map, the driver sees the point in the booking.
test('the passenger chooses the pickup point on the map, the driver sees it', async ({ page, context }) => {
  const state = mapState();
  await mockApi(page, 'active');
  await mockMap(page, state);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('bookings.map.pick')).click();
  await drawn(page);
  await shot(page, '1-map');
  await page.getByText(t('bookings.map.mine')).click();
  await drawn(page);
  await shot(page, '2-mine');
  await page.locator('#tg-main-button', { hasText: t('bookings.map.here') }).click();
  await expect.poll(() => state.saved.length).toBe(1);
  expect(state.pickup?.lat).toBeCloseTo(41.3113, 3);
  expect(state.pickup?.lng).toBeCloseTo(69.2795, 3);
  await expect(page.getByText(t('bookings.plate'))).toBeVisible();
  await shot(page, '3-booking');

  const driver = await context.newPage();
  const { published, trip } = await mockApi(driver, 'active');
  published.push(trip);
  await mockMap(driver, state);
  await mockTelegram(driver);
  await driver.goto(telegramUrl(appUrl(DRIVER.port)));
  await driver.getByText(t('common.myTrips')).click();
  await driver.getByText('Jasur').first().click();
  await driver.getByText('Madina').click();
  await expect(driver.getByText(t('bookings.pickup'), { exact: true })).toBeVisible();
  await expect(driver.getByText(t('bookings.openMap')).first()).toBeVisible();
  await shot(driver, '4-driver');
});

// G23: the passenger finds a place by name, written in Cyrillic; the map moves to it and it is saved.
test('the passenger finds the pickup place by name and saves it', async ({ page }) => {
  const state = mapState();
  await mockApi(page, 'active');
  await mockMap(page, state);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('bookings.map.pick')).click();
  await drawn(page);
  await page.getByPlaceholder(t('bookings.map.search')).fill('Мустақиллик');
  await expect(page.getByText('Mustaqillik maydoni')).toBeVisible();
  expect(state.searched).toEqual(['Мустақиллик']);
  await shot(page, '5-search');
  await page.getByText('Mustaqillik maydoni').click();
  await expect(page.getByText("Mustaqillik shoh ko'chasi")).toBeHidden();
  await drawn(page);
  await shot(page, '6-found');
  await page.locator('#tg-main-button', { hasText: t('bookings.map.here') }).click();
  await expect.poll(() => state.saved.length).toBe(1);
  expect(state.pickup?.lat).toBeCloseTo(FOUND[0]?.point.lat ?? 0, 4);
  expect(state.pickup?.lng).toBeCloseTo(FOUND[0]?.point.lng ?? 0, 4);
});
