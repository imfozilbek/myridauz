import {
  chatKeyOfBooking,
  chatKeyOfOffer,
  type BookedPlace,
  type Booking,
  type Point,
  type Trip,
} from '@platform/contracts';
import type { Named } from '../domain/booking';
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

// The passenger sees the own points; the driver the area until the confirmation, then the point
// and its name (docs/70); the team only the area (docs/14). Erased points show nothing.
function place(point: Point | null, named: Named | null, whole: boolean): BookedPlace | null {
  if (!point && !named) return null;
  return {
    point: whole ? point : null,
    name: whole ? (named?.name ?? null) : null,
    area: named?.area ?? null,
  };
}

export async function bookingViews(
  deps: BookingsDeps,
  records: readonly BookingRecord[],
  viewer: Viewer,
): Promise<Booking[]> {
  const now = deps.now();
  const trips = await tripsOf(deps, records);
  const pitakIds = [...new Set(records.flatMap((record) => (record.pitakId ? [record.pitakId] : [])))];
  const pitaks = new Map(await Promise.all(pitakIds.map(async (id) => [id, await deps.pitak(id)] as const)));
  const views = await Promise.all(
    records.map(async (record): Promise<Booking | null> => {
      const loaded = trips.get(record.tripId);
      const passenger = await deps.people.find(record.passengerId);
      if (!loaded || !passenger) return null;
      const status = statusAt(record, now, loaded.facts.over);
      const open = holdsSeats(status);
      const whole = viewer === 'passenger' || (viewer === 'driver' && open);
      return {
        id: record.id,
        trip: loaded.trip,
        // The driver never sees a passenger's photo (docs/05).
        passenger: {
          id: passenger.publicId,
          firstName: passenger.firstName,
          hasAvatar: viewer !== 'driver' && passenger.avatarKey !== null,
        },
        seats: record.seats,
        price: record.price,
        commission: viewer === 'passenger' ? 0 : record.commission,
        status,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        mode: record.mode,
        pitak: record.pitakId ? (pitaks.get(record.pitakId) ?? null) : null,
        pickup: place(record.pickup, record.pickupNamed, whole),
        dropoff: place(record.dropoff, record.dropoffNamed, whole),
        extraKm: null,
        plate: open && viewer !== 'driver' ? loaded.facts.plate : null,
        chatKey: record.offerId ? chatKeyOfOffer(record.offerId) : chatKeyOfBooking(record.id),
        confirmedAt: record.confirmedAt,
        boardedAt: record.boardedAt,
        arrivedAt: record.arrivedAt,
      };
    }),
  );
  return views.filter((view) => view !== null);
}
