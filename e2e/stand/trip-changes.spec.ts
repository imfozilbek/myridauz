import { expect, test, type Page } from '../crash-guard';
import { createMarketClient, createSubscriptionsClient } from '@platform/api-client';
import {
  FIND_LINK,
  MY_TRIP_LINK,
  requestsLinkValue,
  tashkentDate,
  tashkentTime,
  type Trip,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import { bookingOf, MINUTE, outcome, tailOf, toldBy, wordsOf } from './g27-kit';
import { ANVAR } from './people';
import { NARROW, openHome, PLATFORMS, shot, t, type Platform } from './screen-tour';
import { register } from './seed';
import { outsideCalls, signedAs, type Person } from './stand-kit';
import { botMessages, clearBotMessages, standSql } from './stand-tools';

// The driver moves the time and lowers the price of a published trip (G39, docs/104) on the whole
// local Rida, Toshkent → Andijon: the booked passenger and the subscriber hear it, the search shows
// «Tez orada joʻnaydi» and «Narxi tushdi» on top. Every screen is shot before and after.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const { formatMoney } = createI18n(DEFAULT_LOCALE);
// A route of this goal only (lesson 95).
const ANDIJON = '1703401';
const TO_ANDIJON = { pickup: { lat: 41.2847, lng: 69.2152 }, dropoff: { lat: 40.7833, lng: 72.3507 } };
const BOOKED: Person = { id: 900795, name: 'Shoira', phone: '998901110795' };
const SUBSCRIBED: Person = { id: 900796, name: 'Odina', phone: '998901110796' };

test.beforeAll(async () => {
  for (const person of [BOOKED, SUBSCRIBED]) await register('passenger', person, 'female');
});

const driverMarket = async () => createMarketClient(await signedAs('driver', ANVAR));
const toldCount = async (person: Person, words: string) =>
  (await botMessages()).filter((m) => m.chatId === person.id && m.text.includes(words)).length;

test('8, 9. the booked passenger hears the new time, never a lower price; the subscriber a lower price once a day', async () => {
  const trip = await publishTrip(ANVAR, CHILONZOR, ANDIJON, 'door');
  const seat = await book(BOOKED, trip, { seats: 1, mode: 'door', ...TO_ANDIJON });
  await answer(ANVAR, seat.id, 'confirm');
  const route = { from: CHILONZOR, to: ANDIJON, woman: false, date: tashkentDate(trip.departAt) };
  await createSubscriptionsClient(await signedAs('passenger', SUBSCRIBED)).subscribe(route);
  const market = await driverMarket();
  await clearBotMessages();
  // Later by 30 minutes: yes; earlier, or more than +1 hour in all: no.
  expect((await market.retimeTrip(trip.id, trip.departAt + 30 * MINUTE)).departAt).toBe(
    trip.departAt + 30 * MINUTE,
  );
  await toldBy('passenger', BOOKED, wordsOf('bot.ring.retimed'));
  expect(await outcome(market.retimeTrip(trip.id, trip.departAt))).toBe('trips.invalid_input');
  expect(await outcome(market.retimeTrip(trip.id, trip.departAt + 90 * MINUTE))).toBe('trips.invalid_input');
  // Lower by a step: the booking keeps its price; below the bound: no.
  const { minPrice, roundStep } = await market.recommend(CHILONZOR, ANDIJON);
  const cheaper = await market.lowerTripPrice(trip.id, trip.price - roundStep);
  await toldBy('passenger', SUBSCRIBED, tailOf('bot.news.cheaper'));
  expect((await bookingOf(BOOKED, seat.id))?.price).toBe(trip.price);
  expect(await outcome(market.lowerTripPrice(trip.id, minPrice - roundStep))).toBe(
    'trips.price_out_of_bounds',
  );
  expect(await outcome(market.lowerTripPrice(trip.id, cheaper.price))).toBe('trips.invalid_input');
  // A second lower price the same day: nobody hears it again, the channel post only. The message of a
  // new time after it shows the queue went on past it.
  await market.lowerTripPrice(trip.id, cheaper.price - roundStep);
  await market.retimeTrip(trip.id, trip.departAt + 60 * MINUTE);
  await expect.poll(() => toldCount(BOOKED, wordsOf('bot.ring.retimed'))).toBe(2);
  // The booking keeps its price: its passenger never hears of a lower one (owner decision 04.10.2026).
  expect(await toldCount(BOOKED, 'narxni tushirdi')).toBe(0);
  expect(await toldCount(SUBSCRIBED, tailOf('bot.news.cheaper'))).toBe(1);
});

const findLink = (trip: Trip) =>
  `?${FIND_LINK}=${requestsLinkValue(CHILONZOR, ANDIJON, tashkentDate(trip.departAt))}`;
const card = (page: Page) => page.locator('.search-trip').filter({ hasText: ANVAR.name }).first();

// The trip of this run by its link: the one of the other platform is in the list too (docs/65 B5).
const openOwnTrip = (page: Page, platform: Platform, trip: Trip) =>
  openHome(page, 'driver', ANVAR, platform, `?${MY_TRIP_LINK}=${trip.id}`);

for (const platform of PLATFORMS)
  test(`${platform}: the driver moves the time and lowers the price; the search shows the marks`, async ({
    page,
  }) => {
    const trip = await publishTrip(ANVAR, CHILONZOR, ANDIJON, 'door');
    const name = (step: string) => `g39-${step}`;
    await openHome(page, 'passenger', SUBSCRIBED, platform, findLink(trip));
    await expect(card(page)).toBeVisible();
    await shot(page, platform, name('1-search-before'));
    await openOwnTrip(page, platform, trip);
    await shot(page, platform, name('2-trip-before'));
    // «Vaqt yoki narx» of «Mening safarim» (G63) opens the two changes of G39.
    await page.getByText(t('driverTrip.tile.change')).click();
    await page.getByText(t('market.change.time')).click();
    await shot(page, platform, name('3-time'));
    // The answer of Telegram's window is «Ha, oʻzgartirish» (the stand mock takes the first button).
    await page.getByText(t('market.change.at', { time: tashkentTime(trip.departAt + 30 * MINUTE) })).click();
    await expect(page.getByText(t('driverTrip.tile.change'))).toBeVisible();
    await page.getByText(t('driverTrip.tile.change')).click();
    await page.getByText(t('market.change.price')).click();
    await shot(page, platform, name('4-price'));
    const { roundStep } = await (await driverMarket()).recommend(CHILONZOR, ANDIJON);
    await page.getByText(formatMoney(trip.price - roundStep), { exact: true }).click();
    await expect(page.getByText(t('driverTrip.tile.change'))).toBeVisible();
    await shot(page, platform, name('5-trip-after'));
    // Leaving within an hour: «Tez orada joʻnaydi» too (the time of the stand is moved by hand).
    const soon = Date.now() + 40 * MINUTE;
    standSql(`UPDATE trips SET depart_at = ${soon}, first_depart_at = ${soon} WHERE id = '${trip.id}'`);
    await openHome(page, 'passenger', SUBSCRIBED, platform, findLink({ ...trip, departAt: soon }));
    await expect(card(page).getByText(t('market.mark.cheaper'))).toBeVisible();
    await expect(card(page).getByText(t('market.mark.soon'))).toBeVisible();
    await shot(page, platform, name('6-search-after'));
  });
