import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { chooseWay } from './market';
import { tripOf } from './market-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const shot = async (page: Page, name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/clear-${name}.png`, fullPage: true });
};

// Screens of G21 for the owner review (docs/33, docs/65 B and C).
test('passenger: a screen that did not load has "Back"', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/passenger/bookings', (route) =>
    route.fulfill({ status: 500, json: { error: 'internal' } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await expect(page.getByText(t('errors.generic.title'))).toBeVisible();
  await shot(page, '1-error');
  await pressBack(page);
  await expect(page.getByText(t('common.myTrips'))).toBeVisible();
});

test('passenger: a trip without seats says why', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/trips?*', (route) =>
    route.fulfill({ json: { trips: [tripOf('7', 'Bekzod', false, 20, { status: 'full', seatsLeft: 0 })] } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await chooseWay(page);
  await page.getByText(TEXT.tomorrow).click();
  await page.getByText('Bekzod', { exact: false }).click();
  await expect(page.getByText(t('market.trip.closed.full'))).toBeVisible();
  await expect(page.getByText(TEXT.book)).toHaveCount(0);
  await shot(page, '2-full-trip');
});
