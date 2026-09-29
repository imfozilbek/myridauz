import type { BookingRepository, OfferRepository } from '../application/ports';
import type { BookingRecord } from '../domain/booking';
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
    find: async (id) => rows.get(id),
    byTrips: async (tripIds) => list().filter((booking) => tripIds.includes(booking.tripId)),
    byPassenger: async (passengerId) => list().filter((booking) => booking.passengerId === passengerId),
    byPickupMessage: async (passengerId, messageId) =>
      list().find((booking) => booking.passengerId === passengerId && booking.pickupMessageId === messageId),
    expireOver: async (now) => {
      for (const booking of list())
        if (booking.status === 'requested' && booking.expiresAt <= now)
          rows.set(booking.id, { ...booking, status: 'expired', updatedAt: now });
    },
  };
}

export function createMemoryOffers(): OfferRepository {
  const rows = new Map<string, OfferRecord>();
  return {
    save: async (offer) => void rows.set(offer.id, offer),
    find: async (id) => rows.get(id),
    byRequests: async (requestIds) => [...rows.values()].filter((offer) => requestIds.includes(offer.requestId)),
    byDriver: async (driverId) => [...rows.values()].filter((offer) => offer.driverId === driverId),
  };
}
