import { expect, test, type Page } from '../crash-guard';
import { BOOKING_LINK, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pressBack } from '../telegram-mock';
import { answer, book, CHILONZOR, FARGONA, publishTrip } from './market-kit';
import { BEKZOD, ZARINA } from './people';
import { openReviews } from './screen-tour';
import { outsideCalls, openAs } from './stand-kit';
import { botMessages } from './stand-tools';

const { t } = createI18n(DEFAULT_LOCALE);
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/stand/g21/${name}.png`, animations: 'disabled' });

// The three checks of the owner for G21 (docs/65 B1, B2, B5, B7) on the whole local Rida: Zarina's
// seat from Chilonzor to Fargʻona shahri, confirmed by Bekzod.
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
let booking: Booking;

test.beforeAll(async () => {
  const trip = await publishTrip(BEKZOD, CHILONZOR, FARGONA, 'door');
  const pickup = { lat: 41.2847, lng: 69.2152 };
  const dropoff = { lat: 40.3765, lng: 71.7913 };
  booking = await book(ZARINA, trip, { seats: 1, mode: 'door', pickup, dropoff });
  await answer(BEKZOD, booking.id, 'confirm');
});

// The booking of Zarina in «Mening safarlarim».
async function openBooking(page: Page) {
  await page.getByText(t('common.myTrips')).click();
  // The Android ripple covers the text of a card: the card itself is tapped.
  await page.locator('.mine-card').filter({ hasText: BEKZOD.name }).first().click();
  await expect(page.getByText(t('chat.open'))).toBeVisible();
}

// The network drops: the calls of the API fail, the lists and the reviews alike.
const API = /\/(passenger|users)\//u;

test('1a. a bad network: «Back» from the error screen works, «Qayta urinish» loads', async ({ page }) => {
  await openAs(page, 'passenger', ZARINA);
  await expect(page.getByText(t('common.myTrips'))).toBeVisible();
  await page.route(API, (route) => route.abort('internetdisconnected'));
  // «Mening safarlarim» keeps the lists of the main screen: the bookings stay, no error (G77 D4).
  await page.getByText(t('common.myTrips')).click();
  await expect(page.locator('.mine-card').filter({ hasText: BEKZOD.name }).first()).toBeVisible();
  await pressBack(page);
  await openReviews(page);
  await expect(page.getByText(t('common.retry'))).toBeVisible();
  await shot(page, '1-error');
  await pressBack(page);
  await expect(page.getByText(t('account.profile.reviews'))).toBeVisible();
  await shot(page, '1-back');
  // The network is back: the same screen loads.
  await page.unroute(API);
  await page.getByText(t('account.profile.reviews')).click();
  await expect(page.getByText(t('reviews.empty')).or(page.getByText(t('reviews.list')))).toBeVisible();
  await pressBack(page);
  await pressBack(page);
  await openBooking(page);
});

test('1b. the chat reconnects by itself after the connection drops', async ({ page }) => {
  let drops = 0;
  await page.routeWebSocket('**/chats/**', (socket) => {
    const server = socket.connectToServer();
    // The first connection drops a moment after it opened, as on a train or in a lift.
    if (drops === 0) setTimeout(() => server.close(), 2000);
    drops += 1;
  });
  await openAs(page, 'passenger', ZARINA);
  await openBooking(page);
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(t('chat.system.confirmed'))).toBeVisible();
  await expect.poll(() => drops, { timeout: 15000 }).toBeGreaterThan(1);
  await page.getByLabel(t('chat.placeholder')).fill('Salom, yoʻldaman');
  await page.getByRole('button', { name: t('chat.send') }).click();
  await expect(page.getByText('Salom, yoʻldaman')).toBeVisible();
  await shot(page, '1-chat-reconnected');
});

test('3. a bot button opens its own booking', async ({ page }) => {
  // The passenger bot told Zarina her seat is confirmed; its button opens the Mini App (docs/65 B5).
  const told = (await botMessages()).filter((m) => m.bot === 'passenger' && m.chatId === ZARINA.id);
  const button = told.flatMap((m) => m.buttons).find((b) => b.url?.includes(`${BOOKING_LINK}=${booking.id}`));
  expect(button?.url, 'a button of the bot opens this booking').toBeTruthy();
  await openAs(page, 'passenger', ZARINA, { search: new URL(button?.url ?? '').search });
  await expect(page.getByText(t('chat.open'))).toBeVisible();
  await expect(page.getByText(BEKZOD.name).first()).toBeVisible();
  await shot(page, '3-bot-link');
});

test('2. the driver cancels: the open screen of the passenger changes by itself', async ({ page }) => {
  // By its link: a seat of Zarina already on the road stands above it in the list (docs/90 F-D3).
  await openAs(page, 'passenger', ZARINA, { search: `?${BOOKING_LINK}=${booking.id}` });
  await expect(page.getByText(t('chat.open'))).toBeVisible();
  await shot(page, '2-before');
  await answer(BEKZOD, booking.id, 'cancel');
  // No reload: the signal of the backend refreshes the screen (docs/64).
  await expect(page.getByText(t('bookings.status.cancelled_by_driver')).first()).toBeVisible();
  // The tools of a confirmed seat go away with it (docs/65 B2).
  await expect(page.getByText(t('share.arrived'))).toHaveCount(0);
  await shot(page, '2-cancelled');
});
