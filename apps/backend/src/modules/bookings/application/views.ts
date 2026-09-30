import { chatKeyOfBooking, chatKeyOfOffer, type Booking, type Trip } from '@platform/contracts';
import { holdsSeats, statusAt, type BookingRecord } from '../domain/booking';
import type { BookingsDeps, TripFacts } from './ports';

// Who looks at a booking decides what opens (docs/05, docs/07, docs/14).
export type Viewer = 'passenger' | 'driver' | 'team';

type Loaded = { readonly trip: Trip; readonly facts: TripFacts };

async function tripsOf(deps: BookingsDeps, records: readonly BookingRecord[]) {
  const ids = [...new Set(records.map((booking) => booking.tripId))];
  const [views, facts] = await Promise.all([deps.trips.views(ids), Promise.all(ids.map(deps.trips.find))]);
  const loaded = new Map<string, Loaded>();
  for (const trip of views) {
    const fact = facts.find((item) => item?.id === trip.id);
    if (fact) loaded.set(trip.id, { trip, facts: fact });
  }
  return loaded;
}

export async function bookingViews(
  deps: BookingsDeps,
  records: readonly BookingRecord[],
  viewer: Viewer,
): Promise<Booking[]> {
  const now = deps.now();
  const trips = await tripsOf(deps, records);
  const views = await Promise.all(
    records.map(async (record): Promise<Booking | null> => {
      const loaded = trips.get(record.tripId);
      const passenger = await deps.people.find(record.passengerId);
      if (!loaded || !passenger) return null;
      const status = statusAt(record, now, loaded.facts.over);
      const open = holdsSeats(status);
      return {
        id: record.id,
        trip: loaded.trip,
        // The driver never sees a passenger's photo (docs/05).
        passenger: {
          id: passenger.id,
          firstName: passenger.firstName,
          hasAvatar: viewer !== 'driver' && passenger.avatarKey !== null,
        },
        seats: record.seats,
        price: record.price,
        commission: viewer === 'passenger' ? 0 : record.commission,
        status,
        createdAt: record.createdAt,
        meetingPoint: open ? loaded.facts.meetingPoint : null,
        pickup: open || viewer === 'passenger' ? record.pickup : null,
        plate: open && viewer !== 'driver' ? loaded.facts.plate : null,
        chatKey: record.offerId ? chatKeyOfOffer(record.offerId) : chatKeyOfBooking(record.id),
        boardedAt: record.boardedAt,
        arrivedAt: record.arrivedAt,
      };
    }),
  );
  return views.filter((view) => view !== null);
}
