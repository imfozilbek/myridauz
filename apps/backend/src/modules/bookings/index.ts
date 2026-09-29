import { driverTripCancelPath } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { answer } from './application/answer';
import { bookingsDeps } from './deps';
import { rememberPickupMessage, setPickup } from './application/accept';
import { cancelEverything } from './application/cancel-all';
import { chatMember } from './application/chat-member';
import { passengerView } from './application/progress';
import { rideOf, ridesOf } from './application/rides';
import { bookingViews } from './application/views';
import { bookingRoutes } from './http/booking-routes';
import { offerRoutes } from './http/offer-routes';
import { bookingStore } from './infrastructure/store';

export const bookingsModule = new Hono<AppEnv>()
  .route('/', bookingRoutes(bookingsDeps))
  .route('/', offerRoutes(bookingsDeps));

// The driver cancelled a trip: its requests are declined and its bookings cancelled "by the driver",
// the commissions go back to the wallet (docs/12, docs/35). Runs around the trips route, like the avatar watch.
const CANCEL_PATH = driverTripCancelPath(':id');
export const tripCancelWatch = new Hono<AppEnv>().use(CANCEL_PATH, async (context, next) => {
  await next();
  if (context.req.method !== 'POST' || context.res.status !== 200) return;
  const deps = bookingsDeps(context.env);
  const driverId = context.get('session').user.id;
  for (const booking of await deps.bookings.byTrips([context.req.param('id') ?? '']))
    if (booking.status === 'requested' || booking.status === 'confirmed')
      await answer(deps, driverId, booking.id, 'driver_cancel');
});

// The Cron job (docs/35): requests without an answer in time become expired.
export const expireBookings = (env: Bindings, now: number) => bookingStore(env).expireOver(now);

// A location the passenger sent to the passenger bot as an answer to the confirmation (docs/14).
export const pickupFromBot = (
  env: Bindings,
  passengerId: number,
  messageId: number,
  lat: number,
  lng: number,
) => setPickup(bookingsDeps(env), passengerId, messageId, { lat, lng });

// For the chat: who may open it (docs/07). For the queue: the id of the confirmation message.
export const chatMemberOf = (env: Bindings, key: string, userId: number) =>
  chatMember(bookingsDeps(env), key, userId);
export const pickupMessageSent = (env: Bindings, bookingId: string, messageId: number) =>
  rememberPickupMessage(bookingsDeps(env), bookingId, messageId);
export const bookingForShare = (env: Bindings, id: string) => passengerView(bookingsDeps(env), id);

// Confirmed bookings of these trips as their passengers see them: the reminders (G10).
export const confirmedBookings = async (env: Bindings, tripIds: readonly string[]) => {
  const deps = bookingsDeps(env);
  const confirmed = (await deps.bookings.byTrips(tripIds)).filter(
    (booking) => booking.status === 'confirmed',
  );
  return bookingViews(deps, confirmed, 'passenger');
};

// Rides for the ratings and the complaints (G11): one booking, or the rides of ended trips.
export type { Ride } from './application/rides';
export const rideOfBooking = (env: Bindings, bookingId: string) => rideOf(bookingsDeps(env), bookingId);
export const ridesOfTrips = (env: Bindings, trips: Parameters<typeof ridesOf>[1]) =>
  ridesOf(bookingsDeps(env), trips);

// A blocked person: live trips and open bookings are cancelled (docs/17, G11).
export const cancelAllOf = (env: Bindings, userId: number) => cancelEverything(bookingsDeps(env), userId);

// The history of a passenger for a moderator: how many rides they took (docs/17).
export const passengerRideCount = async (env: Bindings, passengerId: number) =>
  (await bookingsDeps(env).bookings.byPassenger(passengerId)).filter(
    (booking) => booking.status === 'confirmed' || booking.status === 'completed',
  ).length;
