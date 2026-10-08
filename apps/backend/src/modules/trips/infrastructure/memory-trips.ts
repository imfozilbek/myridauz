import type { TripRepository } from '../application/ports';
import type { TripRecord } from '../domain/trip';

const live = (trip: TripRecord) => trip.status === 'active' || trip.status === 'full';

export function createMemoryTrips(): TripRepository {
  const trips = new Map<string, TripRecord>();
  return {
    save: async (trip) => void trips.set(trip.id, trip),
    find: async (id) => trips.get(id),
    byDriver: async (driverId) => [...trips.values()].filter((trip) => trip.driverId === driverId),
    latestOf: async (driverId, limit) =>
      [...trips.values()]
        .filter((trip) => trip.driverId === driverId)
        .sort((a, b) => b.departAt - a.departAt)
        .slice(0, limit),
    leaving: async (from, to, places) =>
      [...trips.values()]
        .filter(
          (trip) =>
            trip.status === 'active' &&
            trip.departedAt === null &&
            trip.departAt >= from &&
            trip.departAt < to &&
            places.includes(trip.from),
        )
        .sort((a, b) => a.departAt - b.departAt),
    departing: async (from, to) =>
      [...trips.values()].filter((trip) => live(trip) && trip.departAt >= from && trip.departAt < to),
    ended: async (from, to) =>
      [...trips.values()].filter(
        (trip) => trip.status !== 'cancelled' && trip.endsAt >= from && trip.endsAt < to,
      ),
    between: async (from, to, limit) =>
      [...trips.values()]
        .filter((trip) => trip.departAt >= from && trip.departAt < to)
        .sort((a, b) => a.departAt - b.departAt)
        .slice(0, limit),
    pricedBetween: async (from, to, limit) =>
      [...trips.values()]
        .filter((trip) => trip.status !== 'cancelled' && trip.departAt >= from && trip.departAt < to)
        .sort((a, b) => b.departAt - a.departAt)
        .slice(0, limit),
    completeOver: async (now) => {
      for (const trip of trips.values())
        if (live(trip) && trip.endsAt <= now) trips.set(trip.id, { ...trip, status: 'completed' });
    },
    // The same conditions as the UPDATE of D1: a cancel or a second tap that came first wins.
    depart: async (id, at) => {
      const trip = trips.get(id);
      if (!trip || !live(trip) || trip.departedAt !== null) return false;
      trips.set(id, { ...trip, departedAt: at });
      return true;
    },
    arrive: async (id, at) => {
      const trip = trips.get(id);
      if (!trip || !live(trip) || trip.arrivedAt !== null) return false;
      if (trip.departedAt === null && trip.departAt > at) return false;
      trips.set(id, { ...trip, departedAt: trip.departedAt ?? trip.departAt, arrivedAt: at });
      return true;
    },
    cancel: async (id) => {
      const trip = trips.get(id);
      if (!trip || !live(trip) || trip.departedAt !== null) return false;
      trips.set(id, { ...trip, status: 'cancelled' });
      return true;
    },
    notDeparted: async (from, to) =>
      [...trips.values()].filter(
        (trip) => live(trip) && trip.departedAt === null && trip.departAt >= from && trip.departAt <= to,
      ),
  };
}
