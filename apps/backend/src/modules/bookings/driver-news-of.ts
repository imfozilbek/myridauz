import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { showCards } from '../notifications';
import type { BookingsDeps } from './application/ports';
import { bookingViews } from './application/views';
import { driverNews } from './infrastructure/driver-news';
import { brandOf } from '../../shared/brand/brand-of';

// The trip card of the driver bot (G68, docs/122): the trip as its driver sees it now, with every
// booking in the order they came.
export const driverNewsOf = (env: Bindings, deps: BookingsDeps) =>
  driverNews({
    brand: brandOf(env),
    places: () => placesOf(env),
    show: (cards, rings) => showCards(env, cards, rings),
    trip: async (tripId) => {
      const [[trip], facts, records] = await Promise.all([
        deps.trips.views([tripId]),
        deps.trips.find(tripId),
        deps.bookings.byTrips([tripId]),
      ]);
      if (!trip || !facts) return undefined;
      const ordered = [...records].sort((one, other) => one.createdAt - other.createdAt);
      return { trip, chatId: facts.driverId, bookings: await bookingViews(deps, ordered, 'driver') };
    },
    now: deps.now,
  });
