import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { bookSeats, confirmBooking } from './bookings';
import { passengerChat } from './chat';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [PASSENGER, DRIVER] = MINI_APPS;

// Both sides of a booking in the real build (G08): a passenger asks, the driver confirms.
test('a passenger books seats on a trip', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await bookSeats(page);
});

test('a driver confirms a booking with the commission', async ({ page }) => {
  const { published, trip, answered } = await mockApi(page, 'active');
  published.push(trip);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await confirmBooking(page);
  expect(answered.at(-1)).toContain('/confirm');
});

test('a passenger writes in the chat and a phone is hidden', async ({ page }) => {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await passengerChat(page);
});
