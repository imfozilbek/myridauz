import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
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

// A full trip is never in the search (docs/90 F-P4); a link from a channel or a bot opens it.
test('passenger: a trip without seats says why', async ({ page }) => {
  await mockApi(page, 'active');
  const full = tripOf('7', 'Bekzod', false, 20, { status: 'full', seatsLeft: 0 });
  await page.route(`**/api/trips/${full.id}`, (route) => route.fulfill({ json: full }));
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?trip=${full.id}`));
  await expect(page.getByText(t('market.trip.closed.full'))).toBeVisible();
  await expect(page.locator('#tg-main-button', { hasText: TEXT.book })).toBeHidden();
  await shot(page, '2-full-trip');
});
