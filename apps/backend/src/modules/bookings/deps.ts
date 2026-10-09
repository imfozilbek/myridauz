import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { bookingCommission } from '../billing';
import { maskContacts, postSystemEvent } from '../chat';
import { recordServerEvent } from '../analytics';
import { approvedCar } from '../drivers';
import { recommendationFor } from '../pricing';
import { notify } from '../notifications';
import {
  cancelRequestOf,
  markMatched,
  passengerRequestFacts,
  requestFacts,
  requestViewOf,
} from '../ride-requests';
import {
  cancelFor,
  driverTripIds,
  openTripFor,
  publishOfferTripFor,
  publishPrivateTripFor,
  releaseTripFor,
  scheduleErrorFor,
  tripChanged,
  tripFacts,
  tripViewsOf,
} from '../trips';
import { tellCloseOnes } from '../shares';
import { driverNewsOf } from './driver-news-of';
import { passengerNewsOf } from './passenger-news-of';
import { ratingsOfPeople, starsOf } from '../ratings';
import { peopleOf } from '../users';
import { describePoint, pointFitsPlace } from '../map';
import { pitakById } from '../pitaks';
import { chargeCommission, refundCommission, walletCanAfford } from '../wallet';
import type { BookingsDeps } from './application/ports';
import { d1Offers } from './infrastructure/d1-offers';
import { createMemoryOffers } from './infrastructure/memory-bookings';
import { d1Talks } from './infrastructure/d1-talks';
import { createMemoryTalks } from './infrastructure/memory-talks';
import { bookingStore } from './infrastructure/store';
import { meetingPorts } from './infrastructure/meeting-ports';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { requestNewsOf } from './request-news';
import { tellPairTalked } from './infrastructure/pair-sign';

const localOffers = createMemoryOffers();
const localTalks = createMemoryTalks();

// A confirmed or cancelled booking changes the seats left: the channel posts follow (docs/15).
const seatsFollow = (env: Bindings, notifier: BookingsDeps['notify']): BookingsDeps['notify'] => ({
  ...notifier,
  confirmed: async (booking, own) => {
    await notifier.confirmed(booking, own);
    await tripChanged(env, booking.trip.id);
  },
  cancelled: async (booking, by) => {
    await notifier.cancelled(booking, by);
    await tripChanged(env, booking.trip.id);
  },
});

export const bookingsDeps = (env: Bindings): BookingsDeps => {
  const deps: BookingsDeps = {
    bookings: bookingStore(env),
    offers: env.DB ? d1Offers(env.DB) : localOffers,
    talks: env.DB ? d1Talks(env.DB) : localTalks,
    requestRings: loadBrand(env.BRAND).calls.requestRings,
    trips: {
      find: (id) => tripFacts(env, id),
      ofDriver: (driverId) => driverTripIds(env, driverId),
      scheduleError: (driverId, trip) => scheduleErrorFor(env, driverId, trip),
      views: (ids) => tripViewsOf(env, ids),
      publish: (driverId, input) => publishOfferTripFor(env, driverId, input),
      publishPrivate: (driverId, input, requestId) => publishPrivateTripFor(env, driverId, input, requestId),
      open: (driverId, tripId) => openTripFor(env, driverId, tripId),
      release: (tripId) => releaseTripFor(env, tripId),
      cancel: (driverId, tripId) => cancelFor(env, driverId, tripId),
    },
    requests: {
      find: (id) => requestFacts(env, id),
      view: (id) => requestViewOf(env, id),
      ofPassenger: (passengerId) => passengerRequestFacts(env, passengerId),
      matched: (id) => markMatched(env, id),
      cancel: async (passengerId, id) => void (await cancelRequestOf(env, passengerId, id)),
    },
    wallet: {
      commission: bookingCommission(env),
      canAfford: (driverId, amount) => walletCanAfford(env, driverId, amount),
      charge: (driverId, bookingId, amount) => chargeCommission(env, driverId, bookingId, amount),
      refund: (driverId, bookingId) => refundCommission(env, driverId, bookingId),
    },
    people: peopleOf(env),
    ratings: (ids) => ratingsOfPeople(env, ids),
    rated: async (userId) => new Set((await starsOf(env, userId)).given.keys()),
    approvedCar: (driverId) => approvedCar(env, driverId),
    recommend: (from, to) => recommendationFor(env, from, to),
    track: (step) => recordServerEvent(env, { name: 'booking_step', code: step }),
    notify: seatsFollow(
      env,
      telegramNotifier({
        brand: loadBrand(env.BRAND),
        notify: (jobs) => notify(env, jobs),
        system: (key, event) => postSystemEvent(env, key, event),
        closeOnes: (booking, update) => tellCloseOnes(env, booking, update),
        passenger: passengerNewsOf(env),
        driver: (tripId, about, ring) => driverNewsOf(env, deps)(tripId, about, ring),
        request: (id, offer) => requestNewsOf(env, deps)(id, offer),
      }),
    ),
    pairTalked: (driverId, passengerId, talks) => tellPairTalked(env, driverId, passengerId, talks),
    places: { describe: (point) => describePoint(env, point), fits: pointFitsPlace },
    pitak: (id) => pitakById(env, id),
    meeting: meetingPorts(env),
    mask: (text) => maskContacts(text).text,
    now: Date.now,
    newId: () => crypto.randomUUID(),
  };
  return deps;
};
