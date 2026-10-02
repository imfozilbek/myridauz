import type { TripRepository } from '../application/ports';
import type { TripRecord } from '../domain/trip';

export function createMemoryTrips(): TripRepository {
  const trips = new Map<string, TripRecord>();
  return {
    save: async (trip) => void trips.set(trip.id, trip),
    find: async (id) => trips.get(id),
    byDriver: async (driverId) => [...trips.values()].filter((trip) => trip.driverId === driverId),
    leaving: async (from, to) =>
      [...trips.values()]
        .filter((trip) => trip.status === 'active' && trip.departAt >= from && trip.departAt < to)
        .sort((a, b) => a.departAt - b.departAt),
    departing: async (from, to) =>
      [...trips.values()].filter(
        (trip) =>
          (trip.status === 'active' || trip.status === 'full') && trip.departAt >= from && trip.departAt < to,
      ),
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
        if ((trip.status === 'active' || trip.status === 'full') && trip.endsAt <= now)
          trips.set(trip.id, { ...trip, status: 'completed' });
    },
  };
}
