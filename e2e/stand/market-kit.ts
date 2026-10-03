import {
  createBookingsClient,
  createMarketClient,
  type BookingsClient,
  type MarketClient,
} from '@platform/api-client';
import type { BookingInput, DriverBookingAction, PickupMode, Trip } from '@platform/contracts';
import { tashkentDate } from '@platform/contracts';
import { freeDepart, freshDriver } from './schedule-kit';
import { signedAs, type Person } from './stand-kit';

// Trips and bookings of the stand made through the API, as the apps make them (docs/75).
export const CHILONZOR = '1726294';
export const FARGONA = '1730401';
export const BUXORO = '1706401';

const DAY = 24 * 60 * 60 * 1000;
const MORNING = '08:00';

type App = 'passenger' | 'driver';
const marketOf = async (app: App, person: Person): Promise<MarketClient> =>
  createMarketClient(await signedAs(app, person));
const bookingsOf = async (app: App, person: Person): Promise<BookingsClient> =>
  createBookingsClient(await signedAs(app, person));

// A trip of tomorrow morning at the recommended share, 4 seats: 08:00, or the first time the driver
// makes after another trip of the scenario (docs/103).
export async function publishTrip(driver: Person, from: string, to: string, pickupMode: PickupMode) {
  freshDriver(driver);
  const market = await marketOf('driver', driver);
  const { price } = await market.recommend(from, to);
  const departAt = await freeDepart(market, from, to, tashkentDate(Date.now() + DAY), MORNING);
  const input = { from, to, departAt, seats: 4, price, womanOnBoard: false, comment: '' };
  return market.publishTrip({ ...input, pickupMode });
}

export const book = async (passenger: Person, trip: Trip, input: BookingInput) =>
  (await bookingsOf('passenger', passenger)).book(trip.id, input);

export const answer = async (driver: Person, bookingId: string, action: DriverBookingAction) =>
  (await bookingsOf('driver', driver)).answer(bookingId, action);

export const cancelMine = async (passenger: Person, bookingId: string) =>
  (await bookingsOf('passenger', passenger)).cancelMine(bookingId);
