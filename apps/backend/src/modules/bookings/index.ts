import { loadBrand } from '@platform/brands';
import { driverTripCancelPath } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { bookingCommission } from '../billing';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { markMatched, passengerRequestFacts, requestFacts } from '../ride-requests';
import { cancelFor, driverTripIds, publishFor, tripFacts, tripViewsOf } from '../trips';
import { peopleOf } from '../users';
import { chargeCommission, refundCommission, walletCanAfford } from '../wallet';
import { answer } from './application/answer';
import { setPickup } from './application/accept';
import type { BookingsDeps } from './application/ports';
import { bookingRoutes } from './http/booking-routes';
import { offerRoutes } from './http/offer-routes';
import { d1Offers } from './infrastructure/d1-offers';
import { createMemoryOffers } from './infrastructure/memory-bookings';
import { bookingStore } from './infrastructure/store';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const localOffers = createMemoryOffers();

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
  notify: telegramNotifier({
    fetch: (input, init) => fetch(input, init),
    brand: loadBrand(env.BRAND),
    passengerToken: env.PASSENGER_BOT_TOKEN,
    driverToken: env.DRIVER_BOT_TOKEN,
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
  }),
  now: Date.now,
  newId: () => crypto.randomUUID(),
});

export const bookingsModule = new Hono<AppEnv>()
  .route('/', bookingRoutes(bookingsDeps))
  .route('/', offerRoutes(bookingsDeps));

// The driver cancelled a trip: its requests are declined and its bookings cancelled "by the driver",
// without a refund (docs/12, docs/35). Runs around the trips route, like the avatar watch.
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
export const pickupFromBot = (env: Bindings, passengerId: number, messageId: number, lat: number, lng: number) =>
  setPickup(bookingsDeps(env), passengerId, messageId, { lat, lng });
