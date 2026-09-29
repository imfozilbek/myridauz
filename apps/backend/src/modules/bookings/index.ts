import { loadBrand } from '@platform/brands';
import { driverTripCancelPath } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { bookingCommission } from '../billing';
import { postSystemEvent } from '../chat';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { notify } from '../notifications';
import { markMatched, passengerRequestFacts, requestFacts } from '../ride-requests';
import { cancelFor, driverTripIds, publishFor, tripChanged, tripFacts, tripViewsOf } from '../trips';
import { tellCloseOnes } from '../shares';
import { peopleOf } from '../users';
import { chargeCommission, refundCommission, walletCanAfford } from '../wallet';
import { answer } from './application/answer';
import { rememberPickupMessage, setPickup } from './application/accept';
import { chatMember } from './application/chat-member';
import { passengerView } from './application/progress';
import { bookingViews } from './application/views';
import type { BookingsDeps } from './application/ports';
import { bookingRoutes } from './http/booking-routes';
import { offerRoutes } from './http/offer-routes';
import { d1Offers } from './infrastructure/d1-offers';
import { createMemoryOffers } from './infrastructure/memory-bookings';
import { bookingStore } from './infrastructure/store';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const localOffers = createMemoryOffers();

// A confirmed or cancelled booking changes the seats left: the channel posts follow (docs/15).
const seatsFollow = (env: Bindings, notifier: BookingsDeps['notify']): BookingsDeps['notify'] => ({
  ...notifier,
  confirmed: async (booking) => {
    await notifier.confirmed(booking);
    await tripChanged(env, booking.trip.id);
  },
  cancelled: async (booking, by) => {
    await notifier.cancelled(booking, by);
    await tripChanged(env, booking.trip.id);
  },
});

const bookingsDeps = (env: Bindings): BookingsDeps => ({
  bookings: bookingStore(env),
  offers: env.DB ? d1Offers(env.DB) : localOffers,
  trips: {
    find: (id) => tripFacts(env, id),
    ofDriver: (driverId) => driverTripIds(env, driverId),
    views: (ids) => tripViewsOf(env, ids),
    publish: (driverId, input) => publishFor(env, driverId, input),
    cancel: (driverId, tripId) => cancelFor(env, driverId, tripId),
  },
  requests: {
    find: (id) => requestFacts(env, id),
    ofPassenger: (passengerId) => passengerRequestFacts(env, passengerId),
    matched: (id) => markMatched(env, id),
  },
  wallet: {
    commission: bookingCommission(env),
    canAfford: (driverId, amount) => walletCanAfford(env, driverId, amount),
    charge: (driverId, bookingId, amount) => chargeCommission(env, driverId, bookingId, amount),
    refund: (driverId, bookingId) => refundCommission(env, driverId, bookingId),
  },
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  notify: seatsFollow(
    env,
    telegramNotifier({
      brand: loadBrand(env.BRAND),
      notify: (jobs) => notify(env, jobs),
      system: (key, event) => postSystemEvent(env, key, event),
      placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
      closeOnes: (booking, update) => tellCloseOnes(env, booking, update),
    }),
  ),
  now: Date.now,
  newId: () => crypto.randomUUID(),
});

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
