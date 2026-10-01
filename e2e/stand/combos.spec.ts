import { expect, test } from '@playwright/test';
import { createMarketClient } from '@platform/api-client';
import { tashkentDate } from '@platform/contracts';
import { book, CHILONZOR, cancelMine, publishTrip } from './market-kit';
import { bookingOf, MINUTE, outcome, SAMARQAND, toldBy, TO_SAMARQAND, wordsOf } from './g27-kit';
import { GAYRAT, TIMUR } from './people';
import { signedAs } from './stand-kit';
import { botMessages, clearBotMessages, runCron, standSql } from './stand-tools';

// The combinations of docs/82: the way of a trip × the way of a seat, «ayol bor» with a man driver,
// a seat cancelled before an answer, an empty search, the post of a trip that left.
test.describe.configure({ mode: 'serial' });
const URGUT = '1718236';
const TO_URGUT = { pickup: null, dropoff: { lat: 39.402, lng: 67.243 } };

test('docs/82 ways: a pitak trip takes no seat from home, a city trip takes no seat at the pitak', async () => {
  const pitakOnly = await publishTrip(GAYRAT, CHILONZOR, URGUT, 'pitak');
  const door = { seats: 1, mode: 'door' as const, pickup: TO_SAMARQAND.pickup, dropoff: TO_URGUT.dropoff };
  expect(await outcome(book(TIMUR, pitakOnly, door))).toBe('bookings.wrong_mode');
  const cityOnly = await publishTrip(GAYRAT, CHILONZOR, SAMARQAND, 'door');
  const pitak = { seats: 1, mode: 'pitak' as const, pickup: null, dropoff: TO_SAMARQAND.dropoff };
  expect(await outcome(book(TIMUR, cityOnly, pitak))).toBe('bookings.wrong_mode');
});

test('C06, P12. a seat cancelled before the answer: the driver hears it; an empty day is empty', async () => {
  const trip = await publishTrip(GAYRAT, CHILONZOR, SAMARQAND, 'door');
  const seat = await book(TIMUR, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  await cancelMine(TIMUR, seat.id);
  expect((await bookingOf(TIMUR, seat.id))?.status).toBe('cancelled_by_passenger');
  await toldBy('driver', GAYRAT, wordsOf('bot.booking.cancelledByPassenger'));
  const market = createMarketClient(await signedAs('passenger', TIMUR));
  const far = new Date(Date.now() + 20 * 24 * 60 * MINUTE).toISOString().slice(0, 10);
  expect(await market.searchTrips({ from: CHILONZOR, to: '1735401', date: far })).toEqual([]);
});

test('docs/82 «ayol bor»: a man driver with a woman in the car is found by the filter', async () => {
  const market = createMarketClient(await signedAs('driver', GAYRAT));
  const { price } = await market.recommend(CHILONZOR, SAMARQAND);
  const departAt = Date.now() + 26 * 60 * MINUTE;
  const input = {
    from: CHILONZOR,
    to: SAMARQAND,
    departAt,
    seats: 3,
    price,
    womanOnBoard: true,
    comment: '',
  };
  const trip = await market.publishTrip({ ...input, pickupMode: 'door' });
  const search = createMarketClient(await signedAs('passenger', TIMUR));
  const date = tashkentDate(departAt);
  const women = await search.searchTrips({
    from: CHILONZOR,
    to: SAMARQAND,
    date,
    woman: '1',
  });
  expect(women.map((t) => t.id)).toContain(trip.id);
});

test('S28. a trip that left: its channel post says it left, by the Cron', async () => {
  const trip = await publishTrip(GAYRAT, CHILONZOR, SAMARQAND, 'door');
  await expect
    .poll(async () => (await botMessages()).some((m) => m.method === 'sendMessage' && m.chat.startsWith('@')))
    .toBe(true);
  await clearBotMessages();
  // The post keeps the departure of its trip: both move back in time.
  const left = Date.now() - MINUTE;
  standSql(`UPDATE trips SET depart_at = ${left} WHERE id = '${trip.id}'`);
  standSql(`UPDATE channel_posts SET depart_at = ${left} WHERE trip_id = '${trip.id}'`);
  await runCron();
  await expect.poll(async () => (await botMessages()).some((m) => m.method === 'editMessageText')).toBe(true);
});
