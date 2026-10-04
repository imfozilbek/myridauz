import { expect, test } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;

// G19 (docs/64): the driver confirms, the passenger's open screen changes by itself.
test('a confirmed booking shows on the open screen without a reload', async ({ page }) => {
  const { feed } = await mockApi(page, 'active');
  let status = 'requested';
  await page.route('**/api/passenger/bookings', (route) =>
    route.fulfill({ json: { bookings: [{ ...confirmed, status }] } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await expect(page.getByText(t('bookings.status.requested'))).toBeVisible();
  await expect.poll(() => feed.sockets.length).toBeGreaterThan(0);
  // The driver confirmed in another phone: the server says "something changed".
  status = 'confirmed';
  feed.changed();
  await expect(page.getByText(t('bookings.status.confirmed'))).toBeVisible();
  await expect(page.getByText(t('bookings.status.requested'))).toHaveCount(0);
  await page.screenshot({ path: 'screenshots/realtime-2-confirmed.png' });
});

test('coming back to the app refreshes the screen when a signal was missed', async ({ page }) => {
  await mockApi(page, 'active');
  let status = 'requested';
  await page.route('**/api/passenger/bookings', (route) =>
    route.fulfill({ json: { bookings: [{ ...confirmed, status }] } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await expect(page.getByText(t('bookings.status.requested'))).toBeVisible();
  await page.screenshot({ path: 'screenshots/realtime-1-requested.png' });
  status = 'confirmed';
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText(t('bookings.status.confirmed'))).toBeVisible();
});
