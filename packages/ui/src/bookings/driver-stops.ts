import { nearestOrder, type Booking, type PlaceName, type Point } from '@platform/contracts';

// A stop of the driver (G24, docs/70): a pitak where several passengers wait, or a door. Only
// confirmed bookings: the driver sees their points after the confirmation (docs/14).
export type Stop = {
  readonly id: string;
  readonly point: Point;
  readonly name: PlaceName | null;
  // The pitak name, or who waits there.
  readonly who: string;
  // Who gets in or out here: the people of one pitak share it.
  readonly riders: readonly Booking[];
};
export type StopKind = 'pickups' | 'dropoffs';

const confirmed = (bookings: readonly Booking[]) =>
  bookings.filter((booking) => booking.status === 'confirmed');

function pickupStops(bookings: readonly Booking[]): Stop[] {
  const stops = new Map<string, Stop>();
  for (const booking of confirmed(bookings)) {
    const { pitak, pickup, passenger } = booking;
    if (pitak) {
      const id = `pitak:${pitak.id}`;
      const riders = [...(stops.get(id)?.riders ?? []), booking];
      stops.set(id, { id, point: pitak.point, name: null, who: pitak.name, riders });
    } else if (pickup?.point) {
      const { point, name } = pickup;
      stops.set(booking.id, { id: booking.id, point, name, who: passenger.firstName, riders: [booking] });
    }
  }
  return [...stops.values()];
}

function dropoffStops(bookings: readonly Booking[]): Stop[] {
  return confirmed(bookings).flatMap((booking) => {
    const { id, dropoff, passenger } = booking;
    return dropoff?.point
      ? [{ id, point: dropoff.point, name: dropoff.name, who: passenger.firstName, riders: [booking] }]
      : [];
  });
}

// The pickups from where the driver stands, then the dropoffs from the last pickup.
export function stopsInOrder(bookings: readonly Booking[], here: Point | null) {
  const pickups = pickupStops(bookings);
  const dropoffs = dropoffStops(bookings);
  const start = here ?? pickups[0]?.point ?? dropoffs[0]?.point;
  if (!start) return { pickups, dropoffs };
  const orderedPickups = nearestOrder(start, pickups);
  const last = orderedPickups.at(-1)?.point ?? start;
  return { pickups: orderedPickups, dropoffs: nearestOrder(last, dropoffs) };
}
