import type { BookingRepository, OfferRepository } from '../application/ports';
import { withoutPoints, type BookingRecord } from '../domain/booking';
import { mark } from '../domain/meeting';
import type { OfferRecord } from '../domain/offer';

// The same rules as D1 without a database (tests and local runs).
export function createMemoryBookings(): BookingRepository {
  const rows = new Map<string, BookingRecord>();
  const list = () => [...rows.values()];
  return {
    save: async (booking) => void rows.set(booking.id, booking),
    replace: async (booking, expected) => {
      if (rows.get(booking.id)?.status !== expected) return false;
      rows.set(booking.id, booking);
      return true;
    },
    confirmWithin: async (booking, tripSeats) => {
      const taken = list()
        .filter((other) => other.tripId === booking.tripId && other.status === 'confirmed')
        .reduce((sum, other) => sum + other.seats, 0);
      if (rows.get(booking.id)?.status !== 'requested' || taken + booking.seats > tripSeats) return false;
      rows.set(booking.id, { ...booking, status: 'confirmed' });
      return true;
    },
    // Read and written in one step, like the guarded UPDATE of D1 (G63).
    markOnce: async (id, step, now) => {
      const booking = rows.get(id);
      const next = booking?.status === 'confirmed' ? mark(booking, step, now) : null;
      if (next === null || typeof next === 'string') return false;
      rows.set(id, next);
      return true;
    },
    find: async (id) => rows.get(id),
    byTrips: async (tripIds) => list().filter((booking) => tripIds.includes(booking.tripId)),
    byPassenger: async (passengerId) => list().filter((booking) => booking.passengerId === passengerId),
    expireOver: async (now) => {
      const expired = list()
        .filter((booking) => booking.status === 'requested' && booking.expiresAt <= now)
        .map((booking) => withoutPoints({ ...booking, status: 'expired' as const, updatedAt: now }));
      for (const booking of expired) rows.set(booking.id, booking);
      return expired;
    },
    waitingPastHalf: async (now) =>
      list().filter(
        (booking) =>
          booking.status === 'requested' &&
          booking.expiresAt > now &&
          booking.createdAt + booking.expiresAt <= 2 * now,
      ),
    keepingPoints: async (before) =>
      list()
        .filter((booking) => booking.pickup !== null || booking.dropoff !== null)
        .filter((booking) => booking.createdAt < before)
        .map(({ id, tripId }) => ({ id, tripId })),
    erasePoints: async (ids) => {
      for (const booking of list())
        if (ids.includes(booking.id)) rows.set(booking.id, withoutPoints(booking));
    },
    erasePointsOf: async (passengerId) => {
      for (const booking of list())
        if (booking.passengerId === passengerId) rows.set(booking.id, withoutPoints(booking));
    },
  };
}

export function createMemoryOffers(): OfferRepository {
  const rows = new Map<string, OfferRecord>();
  return {
    save: async (offer) => void rows.set(offer.id, offer),
    replace: async (offer, expected) => {
      if (rows.get(offer.id)?.status !== expected) return false;
      rows.set(offer.id, offer);
      return true;
    },
    find: async (id) => rows.get(id),
    byRequests: async (requestIds) =>
      [...rows.values()].filter((offer) => requestIds.includes(offer.requestId)),
    byDriver: async (driverId) => [...rows.values()].filter((offer) => offer.driverId === driverId),
  };
}
