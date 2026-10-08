import { driverTripCancelPath, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { answer } from './application/answer';
import { bookingsDeps } from './deps';
import { cancelEverything } from './application/cancel-all';
import { eraseOldPoints } from './application/erase';
import { expireRequests, expireTripRequests } from './application/expire';
import { chatBooking, chatMember } from './application/chat-member';
import { chatKeysOf } from './application/chat-keys';
import { meetingBegun } from './application/meeting';
import { pastRides } from './application/past';
import { passengerView } from './application/progress';
import { filedRideOf, ratableRideOf, rideOf, ridesOf } from './application/rides';
import { tellTripRetimed } from './application/trip-change';
import { bookingViews } from './application/views';
import { isRide } from './domain/meeting';
import { bookingRoutes } from './http/booking-routes';
import { meetingRoutes } from './http/meeting-routes';
import { offerRoutes } from './http/offer-routes';
import { bookingStore } from './infrastructure/store';

export const bookingsModule = new Hono<AppEnv>()
  .route('/', bookingRoutes(bookingsDeps))
  .route('/', offerRoutes(bookingsDeps))
  .route('/', meetingRoutes(bookingsDeps));

// The driver cancelled a trip: its requests are declined and its bookings cancelled "by the driver",
// the commissions go back to the wallet (docs/12, docs/35). Runs around the trips route, like the avatar watch.
// After «Keldi» or «Kelmadi» the ride has begun: the trip is not cancelled any more (G63).
const CANCEL_PATH = driverTripCancelPath(':id');
export const tripCancelWatch = new Hono<AppEnv>().use(CANCEL_PATH, async (context, next) => {
  if (context.req.method !== 'POST') return next();
  const deps = bookingsDeps(context.env);
  const driverId = context.get('session').user.id;
  if (await meetingBegun(deps, driverId, context.req.param('id') ?? ''))
    return context.json({ error: 'trips.wrong_status' satisfies ApiErrorCode }, 409);
  await next();
  if (context.res.status !== 200) return;
  for (const booking of await deps.bookings.byTrips([context.req.param('id') ?? '']))
    if (booking.status === 'requested' || booking.status === 'confirmed')
      await answer(deps, driverId, booking.id, 'driver_cancel');
});

// The driver moved the time: the booked passengers hear it (G39, docs/104).
export const tellBookedOfRetime = (env: Bindings, tripId: string) =>
  tellTripRetimed(bookingsDeps(env), tripId);

// The Cron job (docs/35): requests without an answer in time become expired, the passenger hears it.
export const expireBookings = (env: Bindings, now: number) => expireRequests(bookingsDeps(env), now);
// «Yoʻlga chiqdim» before the time (G63): the requests of the trip end, the passengers hear it.
export const expireBookingsOfTrip = (env: Bindings, tripId: string) =>
  expireTripRequests(bookingsDeps(env), tripId);

// The Cron job (docs/69): points 30 days after the trip go, except under an open complaint.
export const erasePastPoints = (env: Bindings, now: number, complained: ReadonlySet<string>) =>
  eraseOldPoints(bookingsDeps(env), now, complained);
// "Maʼlumotlarimni oʻchirish" (docs/30): every point of the person goes at once.
export const erasePointsOf = (env: Bindings, userId: number) => bookingStore(env).erasePointsOf(userId);

// For the chat: who may open it (docs/07).
export const chatMemberOf = (env: Bindings, key: string, userId: number) =>
  chatMember(bookingsDeps(env), key, userId);
export const chatBookingOf = (env: Bindings, key: string, userId: number) =>
  chatBooking(bookingsDeps(env), key, userId);
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
export const rideOfBooking = (env: Bindings, bookingId: string) => rideOf(bookingsDeps(env), bookingId);
export const filedRideOfBooking = (env: Bindings, bookingId: string) =>
  filedRideOf(bookingsDeps(env), bookingId);
export const ratableRideOfBooking = (env: Bindings, bookingId: string) =>
  ratableRideOf(bookingsDeps(env), bookingId);
export const ridesOfTrips = (env: Bindings, trips: Parameters<typeof ridesOf>[1]) =>
  ridesOf(bookingsDeps(env), trips);

// A blocked person: live trips and open bookings are cancelled (docs/17, G11).
export const cancelAllOf = (env: Bindings, userId: number) => cancelEverything(bookingsDeps(env), userId);

// The history of a passenger for a moderator: how many rides they took (docs/17), not the no-shows.
export const passengerRideCount = async (env: Bindings, passengerId: number) =>
  (await bookingsDeps(env).bookings.byPassenger(passengerId)).filter(isRide).length;

// «Hamyon» names the passenger of a no-show refund (G63): the first name of each booking.
export const passengerNamesOf = async (env: Bindings, bookingIds: readonly string[]) => {
  const deps = bookingsDeps(env);
  const named = await Promise.all(
    bookingIds.map(async (id) => {
      const booking = await deps.bookings.find(id);
      const person = booking && (await deps.people.find(booking.passengerId));
      return person ? [[id, person.firstName] as const] : [];
    }),
  );
  return new Map(named.flat());
};

// "Safarlar tarixi" (G18): the rides of a person that are over.
export const pastRidesOf = (env: Bindings, userId: number, side: 'passenger' | 'driver') =>
  pastRides(bookingsDeps(env), userId, side);

// "Maʼlumotlarimni oʻchirish" (docs/30): every chat of the person.
export const chatsOf = (env: Bindings, userId: number) => chatKeysOf(bookingsDeps(env), userId);
