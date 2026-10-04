import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { findTrips, publishTrip } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [PASSENGER, DRIVER] = MINI_APPS;

test('driver: publishes a trip with the recommended price (G07)', async ({ page }) => {
  const api = await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await publishTrip(page);
  expect(api.published).toEqual([
    expect.objectContaining({ from: '1726294', to: '1718401', seats: 4, price: 90000, comment: '' }),
  ]);
});

test('passenger: finds trips of a day and filters "Mashinada ayol bor" (G07)', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await findTrips(page);
});
