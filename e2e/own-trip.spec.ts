import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { publishTrip } from './market';
import { mockOwnTrip } from './own-trip-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, DRIVER] = MINI_APPS;
const MINUTE = 60_000;

// The trip of a driver end to end (G63, docs/118 path 6, docs/124 В): the one screen, «Mening
// safarim» with its channel, a request confirmed, «Yoʻlga chiqdim» in the hour before the time,
// «Yetib keldik», the stars of «Safar tugadi», «Qaytish» and the one screen again, the other way.
test('driver: publishes, confirms, leaves, arrives, rates and publishes the way back (G63)', async ({
  page,
}) => {
  const api = await mockApi(page, 'active');
  const own = await mockOwnTrip(page, api.published as Record<string, unknown>[]);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await publishTrip(page);
  expect(api.published).toEqual([expect.objectContaining({ from: '1726294', to: '1718401', seats: 4 })]);
  // The channel of the direction posted the trip, three people opened it (docs/119).
  await expect(page.getByText(t('driverTrip.channel.title'))).toBeVisible();
  await expect(page.getByText('Samarqand yoʻli · 3 kishi koʻrdi')).toBeVisible();
  await expect(page.getByText(t('driverTrip.channel.share'))).toBeVisible();
  // A passenger asks: the personal channel brings the request to the open page (docs/64).
  await expect.poll(() => api.feed.sockets.length).toBeGreaterThan(0);
  own.ask();
  api.feed.changed();
  await page.getByText(t('bookings.confirm'), { exact: true }).click();
  await expect(page.getByText(t('driverTrip.passengers', { count: '2' }))).toBeVisible();
  // An hour before the time of the trip the driver opens it again: «Yoʻlga chiqdim».
  await page.clock.setFixedTime(own.departAt() - 59 * MINUTE);
  await pressBack(page);
  await page.locator('.trip-card').first().click();
  const main = page.locator('#tg-main-button');
  await expect(main).toHaveText(t('driverTrip.main.departed'));
  await main.click();
  await expect(main).toHaveText(t('driverTrip.main.arrived'));
  await main.click();
  // «Safar tugadi» right after the arrival: five stars unless lowered, then «Qaytish».
  await expect(page.getByText(t('driverAfter.done.rate'))).toBeVisible();
  await expect(main).toHaveText(t('reviews.send'));
  await main.click();
  await expect(page.getByText(t('driverAfter.back.title'))).toBeVisible();
  await main.click();
  // The one screen of the publishing with the route the other way and the answers of the trip.
  await expect(main).toHaveText(TEXT.publish);
  await expect(page.locator('.points-value').nth(0)).toContainText('Samarqand shahri');
  await expect(page.locator('.points-value').nth(1)).toContainText('Chilonzor');
  // Back from the one screen: the trip is past at once, the server has not closed it yet (lead decision).
  await pressBack(page);
  await expect(page.getByText(t('driverAfter.past.after'))).toBeVisible();
  await expect(main).toHaveText(t('driverAfter.back.publish'));
  expect(own.calls).toEqual([
    'answer confirm',
    'depart',
    'arrive',
    'review {"bookingId":"00000000-0000-4000-8000-0000000000d1","stars":5}',
  ]);
});
