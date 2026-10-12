import {
  createBookingsClient,
  createMarketClient,
  type BookingsClient,
  type MarketClient,
} from '@platform/api-client';
import type { BookingInput, DriverBookingAction, PickupMode, Trip } from '@platform/contracts';
import { tashkentDate } from '@platform/contracts';
import { freeDepart, freshDriver, freshPassenger } from './schedule-kit';
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

// A trip of tomorrow (or `days` ahead) morning at the recommended share, 4 seats: 08:00, or the first
// time after it the driver may leave (docs/103). One live trip of a driver (docs/172).
export async function publishTrip(
  driver: Person,
  from: string,
  to: string,
  pickupMode: PickupMode,
  days = 1,
) {
  freshDriver(driver);
  const market = await marketOf('driver', driver);
  const { price } = await market.recommend(from, to);
  const departAt = freeDepart(tashkentDate(Date.now() + days * DAY), MORNING);
  const input = { from, to, departAt, seats: 4, price, womanOnBoard: false, comment: '' };
  return market.publishTrip({ ...input, pickupMode });
}

export async function book(passenger: Person, trip: Trip, input: BookingInput) {
  freshPassenger(passenger);
  return (await bookingsOf('passenger', passenger)).book(trip.id, input);
}

export const answer = async (driver: Person, bookingId: string, action: DriverBookingAction) =>
  (await bookingsOf('driver', driver)).answer(bookingId, action);

// The driver says no to the waiting seat: one seat at a time, the passenger asks again (docs/172).
export async function declineWaiting(driver: Person, passenger: Person) {
  const mine = await (await bookingsOf('passenger', passenger)).myBookings();
  const waiting = mine.find((booking) => booking.status === 'requested');
  if (!waiting) throw new Error(`stand: no waiting seat of ${passenger.name}`);
  return answer(driver, waiting.id, 'decline');
}

// «Keldi» of the driver at the point: the passenger is in the car (G76, docs/43).
export const markMet = async (driver: Person, bookingId: string) =>
  (await bookingsOf('driver', driver)).meet(bookingId, 'met');

export const cancelMine = async (passenger: Person, bookingId: string) =>
  (await bookingsOf('passenger', passenger)).cancelMine(bookingId);
