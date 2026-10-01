import { expect, test } from '@playwright/test';
import { answer, book, cancelMine, CHILONZOR, publishTrip } from './market-kit';
import { bookingOf, MINUTE, wordsOf, outcome, SAMARQAND, toldBy, TO_SAMARQAND, walletOf } from './g27-kit';
import { AZIZA, FERUZA, MALIKA, NIGORA, RUSTAM, SEVARA, ULUGBEK } from './people';
import { clearBotMessages, standSql } from './stand-tools';

// The paths of a passenger with a seat (docs/77 P24 … P45, docs/82 C04, C07, C12) on the whole local
// Rida: Toshkent → Samarqand, the drivers Ulugʻbek and Rustam.
test.describe.configure({ mode: 'serial' });
const door = (seats: number) => ({ seats, mode: 'door' as const, ...TO_SAMARQAND });

test('P24, P25, C12. the last seat goes to one; the next hears there are no seats', async () => {
  const trip = await publishTrip(ULUGBEK, CHILONZOR, SAMARQAND, 'door');
  const three = await book(AZIZA, trip, door(3));
  await answer(ULUGBEK, three.id, 'confirm');
  // One seat is left: two seats are not offered, one is.
  expect(await outcome(book(MALIKA, trip, door(2)))).toBe('bookings.no_seats');
  const last = await book(FERUZA, trip, door(1));
  const waiting = await book(MALIKA, trip, door(1));
  await answer(ULUGBEK, last.id, 'confirm');
  expect((await bookingOf(FERUZA, last.id))?.status).toBe('confirmed');
  // The trip is full: a new request and the waiting one find no seat.
  expect(await outcome(book(SEVARA, trip, door(1)))).toBe('bookings.no_seats');
  expect(await outcome(answer(ULUGBEK, waiting.id, 'confirm'))).toBe('bookings.no_seats');
});

test('P26, P27. at most 3 waiting requests, one per trip', async () => {
  const publish = () => publishTrip(RUSTAM, CHILONZOR, SAMARQAND, 'door');
  const [first, second, third, fourth] = [await publish(), await publish(), await publish(), await publish()];
  for (const trip of [first, second, third]) await book(SEVARA, trip, door(1));
  expect(await outcome(book(SEVARA, first, door(1)))).toBe('bookings.wrong_status');
  expect(await outcome(book(SEVARA, fourth, door(1)))).toBe('bookings.too_many');
});

test('P29, C04. a declined seat: the passenger hears it from the passenger bot', async () => {
  const trip = await publishTrip(ULUGBEK, CHILONZOR, SAMARQAND, 'door');
  const booking = await book(AZIZA, trip, door(1));
  await clearBotMessages();
  await answer(ULUGBEK, booking.id, 'decline');
  expect((await bookingOf(AZIZA, booking.id))?.status).toBe('declined');
  await toldBy('passenger', AZIZA, wordsOf('bot.booking.declined'));
});

test('P44, C07. a seat cancelled before the departure: the driver hears it, the commission is back', async () => {
  const trip = await publishTrip(ULUGBEK, CHILONZOR, SAMARQAND, 'door');
  const before = await walletOf(ULUGBEK);
  const booking = await book(FERUZA, trip, door(1));
  // The driver sees the commission; the passenger does not (docs/12).
  const { commission } = await answer(ULUGBEK, booking.id, 'confirm');
  expect(commission).toBeGreaterThan(0);
  expect((await walletOf(ULUGBEK)).bonus).toBe(before.bonus - commission);
  await clearBotMessages();
  await cancelMine(FERUZA, booking.id);
  expect((await bookingOf(FERUZA, booking.id))?.status).toBe('cancelled_by_passenger');
  await toldBy('driver', ULUGBEK, wordsOf('bot.booking.cancelledByPassenger'));
  expect((await walletOf(ULUGBEK)).bonus).toBe(before.bonus);
});

test('P45, V05. a confirmed seat is not cancelled on the road', async () => {
  const trip = await publishTrip(RUSTAM, CHILONZOR, SAMARQAND, 'door');
  const booking = await book(MALIKA, trip, door(1));
  await answer(RUSTAM, booking.id, 'confirm');
  standSql(`UPDATE trips SET depart_at = ${Date.now() - 10 * MINUTE} WHERE id = '${trip.id}'`);
  expect(await outcome(cancelMine(MALIKA, booking.id))).toBe('bookings.wrong_status');
  expect((await bookingOf(MALIKA, booking.id))?.status).toBe('confirmed');
});

test('P16, A05. a driver does not book a seat of the own trip', async () => {
  const trip = await publishTrip(NIGORA, CHILONZOR, SAMARQAND, 'door');
  expect(await outcome(book(NIGORA, trip, door(1)))).toBe('bookings.own_trip');
});
