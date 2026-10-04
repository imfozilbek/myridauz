import { expect, test } from '../crash-guard';
import { createBookingsClient, createMarketClient } from '@platform/api-client';
import { BOOKING_ANSWER_HOURS, MAX_OPEN_REQUESTS, tashkentDate } from '@platform/contracts';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import { askRide, MINUTE, outcome, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { JAHONGIR, NARGIZA } from './people';
import { signedAs, staleSignedAs } from './stand-kit';
import { standSql } from './stand-tools';

// The edges of time, limits and the way in (docs/81 A11, A13, V02, V03, docs/77 P11): each one ends
// with a clear refusal, never a half state.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const door = { seats: 1, mode: 'door' as const, ...TO_SAMARQAND };

test('A11. a launch older than a day is refused: the Mini App asks to open it again', async () => {
  const market = createMarketClient(await staleSignedAs('passenger', NARGIZA));
  expect(await outcome(market.myRequests())).toBe('auth.expired');
});

test('P11, A13. a request inside one city is refused; at most 3 open requests', async () => {
  const market = createMarketClient(await signedAs('passenger', NARGIZA));
  const { price } = await market.recommend(CHILONZOR, SAMARQAND);
  const inside = { from: CHILONZOR, to: '1726290', date: tashkentDate(Date.now() + 24 * HOUR), seats: 1 };
  const local = { ...inside, price, pickupMode: 'door' as const, ...TO_SAMARQAND };
  expect(await outcome(market.publishRequest(local))).toMatch(/^locations\./u);
  const days = [1, 2, 3, 4].map((day) => tashkentDate(Date.now() + day * 24 * HOUR));
  const answers = [];
  for (const date of days) answers.push(await outcome(askRide(NARGIZA, date)));
  expect(answers.slice(0, MAX_OPEN_REQUESTS)).toEqual(['ok', 'ok', 'ok']);
  expect(answers.at(-1)).toBe('trips.too_many');
});

test('V02. a seat asked 10 minutes before the departure waits only until the departure', async () => {
  const trip = await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  const departAt = Date.now() + 10 * MINUTE;
  standSql(`UPDATE trips SET depart_at = ${departAt} WHERE id = '${trip.id}'`);
  const seat = await book(NARGIZA, trip, door);
  expect(seat.expiresAt).toBe(departAt);
  expect(seat.expiresAt - seat.createdAt).toBeLessThan(BOOKING_ANSWER_HOURS * HOUR);
});

test('V03. an answer after the deadline is refused: the seat has expired', async () => {
  const trip = await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  const seat = await book(NARGIZA, trip, door);
  standSql(`UPDATE bookings SET expires_at = ${Date.now() - MINUTE} WHERE id = '${seat.id}'`);
  expect(await outcome(answer(JAHONGIR, seat.id, 'confirm'))).toBe('bookings.wrong_status');
  const mine = await createBookingsClient(await signedAs('passenger', NARGIZA)).myBookings();
  expect(mine.find((booking) => booking.id === seat.id)?.status).toBe('expired');
});
