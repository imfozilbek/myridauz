import {
  createBookingsClient,
  createChatClient,
  createFeedbackClient,
  createMarketClient,
  createUsersClient,
} from '@platform/api-client';
import { REQUEST_LINK } from '@platform/contracts';
import type { Page } from '@playwright/test';
import { afterSplash, expect, test } from '../crash-guard';
import { askRide, confirmedSeat, MINUTE, moveTrip, offerOn, setBonus } from './g27-kit';
import { OWNER } from './people';
import { NARROW, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { runCron, standRows } from './stand-tools';

// G89 (docs/213, docs/214) on the whole local Rida: changed states of screens, each shot for the
// owner (docs/33) into screenshots/stand/g89/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g89';
const DRIVER: Person = { id: 900891, name: 'Sardor', phone: '998901110891' };
const LOLA: Person = { id: 900892, name: 'Lola', phone: '998901110892' };
const MOTHER: Person = { id: 900893, name: 'Ona', phone: '998901110893' };
const NODIR: Person = { id: 900894, name: 'Nodir', phone: '998901110894' };
const ZARINA: Person = { id: 900895, name: 'Zarina', phone: '998901110895' };
const BAXODIR: Person = { id: 900896, name: 'Baxodir', phone: '998901110896' };
const HOUR = 60 * MINUTE;
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};
let seatId = '';
let tripId = '';
let token = '';

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01T891SR');
  await register('passenger', LOLA, 'female');
  const { trip, seat } = await confirmedSeat(DRIVER, LOLA);
  seatId = seat.id;
  tripId = trip.id;
  token = (await createChatClient(await signedAs('passenger', LOLA)).share(seat.id)).link.slice(-43);
});

test('U6. close people without the network see «Qayta urinish», not «the trip is gone»', async ({ page }) => {
  await register('passenger', MOTHER, 'female');
  await page.route('**/shared/**', (route) => route.abort());
  await openAs(page, 'passenger', MOTHER, { search: `?follow=${token}` });
  await expect(page.getByText(t('common.retry'))).toBeVisible();
  await shot(page, '1-follow-no-network');
});

test('A11. a «Kelmadi» of a passenger about the driver has no refund switch', async ({ page }) => {
  await createFeedbackClient(await signedAs('passenger', LOLA)).complain({
    bookingId: seatId,
    reasons: ['no_show'],
    comment: 'Haydovchi kelmadi',
  });
  const [complaint] = standRows(`SELECT id FROM complaints WHERE booking_id = '${seatId}'`);
  await openAs(page, 'admin', OWNER, { search: `?complaint=${String(complaint?.['id'])}` });
  await expect(page.getByText(t('navbat.complaint.who'))).toBeVisible();
  await expect(page.getByText(t('complaints.refund'))).toHaveCount(0);
  await shot(page, '2-complaint-no-refund');
});

test('C7. close people of a passenger marked «Kelmadi» find the link closed', async ({ page }) => {
  moveTrip(tripId, Date.now() + 10 * MINUTE, Date.now() + 5 * HOUR);
  const driver = createBookingsClient(await signedAs('driver', DRIVER));
  await driver.meet(seatId, 'came');
  await driver.meet(seatId, 'no_show');
  await openAs(page, 'passenger', MOTHER, { search: `?follow=${token}` });
  await expect(page.getByText(t('share.follow.closed'))).toBeVisible();
  await shot(page, '3-follow-no-show');
});

// A ride over on the stand: the Cron closes the trip moved into the past (S20).
async function rideOver(driver: Person, passenger: Person) {
  const { trip, seat } = await confirmedSeat(driver, passenger);
  moveTrip(trip.id, Date.now() - 10 * HOUR, Date.now() - MINUTE);
  await runCron();
  const market = createMarketClient(await signedAs('driver', driver));
  await expect.poll(async () => (await market.trip(trip.id)).status).toBe('completed');
  return seat.id;
}

test('M9. a ride whose driver deleted the account stays with «Hisob oʻchirilgan»', async ({ page }) => {
  await approvedDriver(NODIR, '01N894SR');
  await register('passenger', ZARINA, 'female');
  const ride = await rideOver(NODIR, ZARINA);
  await createUsersClient(await signedAs('driver', NODIR)).deleteMe();
  await openAs(page, 'passenger', ZARINA, { search: `?booking=${ride}` });
  await expect(page.getByText(t('account.gone')).first()).toBeVisible();
  await shot(page, '4-deleted-driver');
});

test('A7. a published review keeps its stars', async ({ page }) => {
  const ride = await rideOver(DRIVER, MOTHER);
  await createFeedbackClient(await signedAs('passenger', MOTHER)).review({ bookingId: ride, stars: 5 });
  await createFeedbackClient(await signedAs('driver', DRIVER)).review({ bookingId: ride, stars: 2 });
  await openAs(page, 'passenger', MOTHER, { search: `?review=${ride}` });
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: t('reviews.send') }).click();
  await expect(page.getByText(t('errors.reviews.published'))).toBeVisible();
  await shot(page, '5-review-published');
});

test('B5. an offer of a driver short of money says it does not work now', async ({ page }) => {
  await approvedDriver(BAXODIR, '01O896SR');
  const request = await askRide(ZARINA);
  await offerOn(BAXODIR, request.id);
  await setBonus(BAXODIR, 0);
  // The card of the request in the bot opens «Mening soʻrovim» with the offer (G61, G77).
  await openAs(page, 'passenger', ZARINA, { search: `?${REQUEST_LINK}=${request.id}` });
  await page
    .getByRole('button', { name: t('bookings.offer.accept'), exact: true })
    .first()
    .click();
  await expect(page.getByText(t('errors.bookings.offer_unavailable'))).toBeVisible();
  await shot(page, '6-offer-short');
});
