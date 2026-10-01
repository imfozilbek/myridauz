import {
  createBookingsClient,
  createMarketClient,
  type BookingsClient,
  type MarketClient,
} from '@platform/api-client';
import type { BookingInput, DriverBookingAction, PickupMode, Trip } from '@platform/contracts';
import { signedAs, type Person } from './stand-kit';

// Trips and bookings of the stand made through the API, as the apps make them (docs/75).
export const CHILONZOR = '1726294';
export const FARGONA = '1730401';
export const BUXORO = '1706401';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// Uzbekistan is UTC+5: tomorrow at 08:00 there.
const TASHKENT_OFFSET = 5 * HOUR;
const DEPART_HOUR = 8;
const tomorrowMorning = () => {
  const local = Date.now() + TASHKENT_OFFSET + DAY;
  return local - (local % DAY) + DEPART_HOUR * HOUR - TASHKENT_OFFSET;
};

type App = 'passenger' | 'driver';
const marketOf = async (app: App, person: Person): Promise<MarketClient> =>
  createMarketClient(await signedAs(app, person));
const bookingsOf = async (app: App, person: Person): Promise<BookingsClient> =>
  createBookingsClient(await signedAs(app, person));

// A trip of tomorrow morning at the recommended share, 4 seats.
export async function publishTrip(driver: Person, from: string, to: string, pickupMode: PickupMode) {
  const market = await marketOf('driver', driver);
  const { price } = await market.recommend(from, to);
  const input = { from, to, departAt: tomorrowMorning(), seats: 4, price, womanOnBoard: false, comment: '' };
  return market.publishTrip({ ...input, pickupMode });
}

export const book = async (passenger: Person, trip: Trip, input: BookingInput) =>
  (await bookingsOf('passenger', passenger)).book(trip.id, input);

export const answer = async (driver: Person, bookingId: string, action: DriverBookingAction) =>
  (await bookingsOf('driver', driver)).answer(bookingId, action);

export const cancelMine = async (passenger: Person, bookingId: string) =>
  (await bookingsOf('passenger', passenger)).cancelMine(bookingId);
