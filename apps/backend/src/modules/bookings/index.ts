import { driverTripCancelPath, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { answer } from './application/answer';
import { ridingNow } from './application/riding';
import { bookingsDeps } from './deps';
import { boardTrip } from './application/board-trip';
import { cancelEverything } from './application/cancel-all';
import { eraseOldPoints } from './application/erase';
import { expireRequests, expireTripRequests } from './application/expire';
import { chatAbout } from './application/chat-about';
import { chatMember } from './application/chat-member';
import { chatKeysOf } from './application/chat-keys';
import { liveBookingOf } from './application/live-booking';
import { meetingBegun } from './application/meeting';
import { pastRides } from './application/past';
import { passengerView } from './application/progress';
import { filedRideOf, ratableRideOf, rideOf, ridesOf } from './application/rides';
import { expireTripOffers } from './application/salon-trip';
import { tellTripRetimed } from './application/trip-change';
import { bookingRoutes } from './http/booking-routes';
import { meetingRoutes } from './http/meeting-routes';
import { offerRoutes } from './http/offer-routes';
import { talkRoutes } from './http/talk-routes';
import { teamCancelRoutes } from './http/team-cancel-routes';
import { recordAction } from '../journal';
import { bookingStore } from './infrastructure/store';

// The team cancelled a trip (G45): the journal of the team keeps who and which trip.
const tripCancelled = (env: Bindings, memberId: number, tripId: string) =>
  recordAction(env, { memberId, kind: 'trip', subject: tripId, action: 'cancel', since: null });

export const bookingsModule = new Hono<AppEnv>()
  .route('/', bookingRoutes(bookingsDeps))
  .route('/', teamCancelRoutes(bookingsDeps, tripCancelled))
  .route('/', offerRoutes(bookingsDeps))
  .route('/', meetingRoutes(bookingsDeps))
  .route('/', talkRoutes(bookingsDeps));

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
  await expireTripOffers(deps, driverId, context.req.param('id') ?? '');
});

// The driver moved the time: the booked passengers hear it (G39, docs/104).
export const tellBookedOfRetime = (env: Bindings, tripId: string) =>
  tellTripRetimed(bookingsDeps(env), tripId);

// The Cron job (docs/35): requests without an answer in time become expired, the passenger hears it.
export const expireBookings = (env: Bindings, now: number) => expireRequests(bookingsDeps(env), now);
// «Yoʻlga chiqdim» before the time (G63): the requests of the trip end, the passengers hear it.
export const expireBookingsOfTrip = (env: Bindings, tripId: string) =>
  expireTripRequests(bookingsDeps(env), tripId);
export { endOffersOfNewTrip, heldSeatOf } from './one-at-a-time';

// The Cron job (docs/69): points 30 days after the trip go, except under an open complaint.
export const erasePastPoints = (env: Bindings, now: number, complained: ReadonlySet<string>) =>
  eraseOldPoints(bookingsDeps(env), now, complained);
// "Maʼlumotlarimni oʻchirish" (docs/30): every point of the person goes at once.
export const erasePointsOf = (env: Bindings, userId: number) => bookingStore(env).erasePointsOf(userId);

// For the chat: who may open it (docs/07).
export const chatMemberOf = (env: Bindings, key: string, userId: number) =>
  chatMember(bookingsDeps(env), key, userId);
export const chatAboutOf = (env: Bindings, key: string, userId: number) =>
  chatAbout(bookingsDeps(env), key, userId);
export const bookingForShare = (env: Bindings, id: string) => passengerView(bookingsDeps(env), id);
// The driver's trip as people see it, with its seats left: the card of the loop trip (G88, docs/193).
export const driverTripView = async (env: Bindings, tripId: string) => {
  const deps = bookingsDeps(env);
  const [[trip], facts] = await Promise.all([deps.trips.views([tripId]), deps.trips.find(tripId)]);
  return trip && facts ? { trip, driverId: facts.driverId } : undefined;
};

// The live trip cards (G68, docs/122) and the confirmed bookings the reminders tell (G10).
export {
  answerFromBot,
  ASK_PREFIX,
  chatRing,
  confirmedBookings,
  passengerNewsOf,
  requestsPastHalf,
  tellDriver,
  tellRequest,
  tellRequestClosed,
  tellTripPassengers,
} from './live-cards';

// «Yetib keldingizmi?» answered in the passenger bot (G46).
export { answerArrived, ARRIVED_PREFIX } from './arrived-answer';

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
// A blocked person finishes the trip on the way (owner decision 10.10.2026, docs/158 Ж).
export const ridingOf = (env: Bindings, userId: number) => ridingNow(bookingsDeps(env), userId);
export { cancelsOf, passengerRideCount, ridesOfPerson } from './person-facts';

export { driverBookingOf, walletBookingsOf } from './wallet-views';

// The card of a support question shows the booking a passenger lives with now (G68).
export const liveBookingFor = (env: Bindings, passengerId: number) =>
  liveBookingOf(bookingsDeps(env), passengerId);

// "Safarlar tarixi" (G18): the rides of a person that are over.
export const pastRidesOf = (env: Bindings, userId: number, side: 'passenger' | 'driver') =>
  pastRides(bookingsDeps(env), userId, side);

// "Maʼlumotlarimni oʻchirish" (docs/30): every chat of the person.
export const chatsOf = (env: Bindings, userId: number) => chatKeysOf(bookingsDeps(env), userId);

// The trip the board of requests of a driver fills (G64, docs/118 path 7).
export const boardTripOf = (env: Bindings, driverId: number) => boardTrip(bookingsDeps(env), driverId);
