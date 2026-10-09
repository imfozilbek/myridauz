import { expect, test } from '../crash-guard';
import { createMarketClient } from '@platform/api-client';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import {
  askRide,
  bookingOf,
  driverSeatOf,
  MINUTE,
  offerOn,
  outcome,
  SAMARQAND,
  setBonus,
  tailOf,
  TO_SAMARQAND,
  toldBy,
  tomorrow,
  walletOf,
} from './g27-kit';
import { AZIZA, BOBUR, NIGORA, SEVARA, TIMUR, ULUGBEK } from './people';
import { signedAs, type Person } from './stand-kit';

// The paths of a driver (docs/78 D22 … D62, docs/82 C02, C03, C09, the woman table) on the whole local
// Rida: Toshkent → Samarqand.
test.describe.configure({ mode: 'serial' });
const door = { seats: 1, mode: 'door' as const, ...TO_SAMARQAND };
const WELCOME_BONUS = 500_000;
const marketOf = async (driver: Person) => createMarketClient(await signedAs('driver', driver));
const commissionOf = async (driver: Person, bookingId: string) =>
  (await driverSeatOf(driver, bookingId))?.commission ?? 0;

test('D22 … D25. a trip in the past, too far, with too many seats or a price out of bounds', async () => {
  const market = await marketOf(ULUGBEK);
  const { price, maxPrice } = await market.recommend(CHILONZOR, SAMARQAND);
  const trip = { from: CHILONZOR, to: SAMARQAND, seats: 1, price, womanOnBoard: false, comment: '' };
  const publish = (change: object) =>
    outcome(
      market.publishTrip({ ...trip, departAt: Date.now() + 60 * MINUTE, pickupMode: 'door', ...change }),
    );
  expect(await publish({ departAt: Date.now() - MINUTE })).toBe('trips.in_past');
  expect(await publish({ departAt: Date.now() + 31 * 24 * 60 * MINUTE })).toBe('trips.invalid_input');
  expect(await publish({ seats: 5 })).toBe('trips.too_many_seats');
  expect(await publish({ price: maxPrice + 1000 })).toBe('trips.price_out_of_bounds');
});

test('V07, C03, D42, D62, V06, C02, D72. 1 sum short of the commission, then exactly on it', async () => {
  const trip = await publishTrip(BOBUR, CHILONZOR, SAMARQAND, 'door');
  const seat = await book(AZIZA, trip, door);
  const commission = await commissionOf(BOBUR, seat.id);
  await setBonus(BOBUR, commission - 1);
  expect(await outcome(answer(BOBUR, seat.id, 'confirm'))).toBe('wallet.not_enough');
  expect((await bookingOf(AZIZA, seat.id))?.status).toBe('requested');
  const request = await askRide(SEVARA);
  expect(await outcome(offerOn(BOBUR, request.id))).toBe('wallet.not_enough');
  // Exactly the commission: the seat is confirmed, the spent bonus brings the next one (docs/12).
  await setBonus(BOBUR, commission);
  await answer(BOBUR, seat.id, 'confirm');
  const wallet = await walletOf(BOBUR);
  expect(wallet.bonus).toBe(WELCOME_BONUS);
  expect(wallet.operations.filter((op) => op.kind === 'bonus_grant')).toHaveLength(2);
});

test('D45, C09, S62. a whole trip cancelled before the departure: every passenger hears it', async () => {
  const trip = await publishTrip(ULUGBEK, CHILONZOR, SAMARQAND, 'door');
  const before = await walletOf(ULUGBEK);
  const seats = [await book(TIMUR, trip, door), await book(SEVARA, trip, door)];
  for (const seat of seats) await answer(ULUGBEK, seat.id, 'confirm');
  await (await marketOf(ULUGBEK)).cancelTrip(trip.id);
  expect((await bookingOf(TIMUR, seats[0]?.id ?? ''))?.status).toBe('cancelled_by_driver');
  expect((await bookingOf(SEVARA, seats[1]?.id ?? ''))?.status).toBe('cancelled_by_driver');
  for (const passenger of [TIMUR, SEVARA])
    await toldBy('passenger', passenger, tailOf('bot.ring.cancelledByDriver'));
  expect((await walletOf(ULUGBEK)).bonus).toBe(before.bonus);
});

test('D27, P13. «Mashinada ayol bor»: a woman driver is found by the filter, a man without a woman not', async () => {
  const hers = await publishTrip(NIGORA, CHILONZOR, SAMARQAND, 'door');
  const his = await publishTrip(ULUGBEK, CHILONZOR, SAMARQAND, 'door');
  expect(hers.woman).toBe(true);
  expect(his.woman).toBe(false);
  const market = createMarketClient(await signedAs('passenger', AZIZA));
  const search = { from: CHILONZOR, to: SAMARQAND, date: tomorrow() };
  const all = (await market.searchTrips(search)).map((trip) => trip.id);
  const women = (await market.searchTrips({ ...search, woman: '1' })).map((trip) => trip.id);
  expect(all).toEqual(expect.arrayContaining([hers.id, his.id]));
  expect(women).toContain(hers.id);
  expect(women).not.toContain(his.id);
});
