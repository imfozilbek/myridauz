import { nearestOrder, type Booking, type PlaceName, type Point } from '@platform/contracts';

// A stop of the driver (G24, docs/70): a pitak where several passengers wait, or a door. Only
// confirmed bookings: the driver sees their points after the confirmation (docs/14).
export type Stop = {
  readonly id: string;
  readonly point: Point;
  readonly name: PlaceName | null;
  // The pitak name, or who waits there.
  readonly who: string;
};
export type StopKind = 'pickups' | 'dropoffs';

const confirmed = (bookings: readonly Booking[]) =>
  bookings.filter((booking) => booking.status === 'confirmed');

function pickupStops(bookings: readonly Booking[]): Stop[] {
  const stops = new Map<string, Stop>();
  for (const booking of confirmed(bookings)) {
    const { pitak, pickup, passenger } = booking;
    if (pitak) {
      const name: PlaceName = { step: 'landmark', name: pitak.name };
      stops.set(`pitak:${pitak.id}`, { id: `pitak:${pitak.id}`, point: pitak.point, name, who: pitak.name });
    } else if (pickup?.point) {
      stops.set(booking.id, {
        id: booking.id,
        point: pickup.point,
        name: pickup.name,
        who: passenger.firstName,
      });
    }
  }
  return [...stops.values()];
}

function dropoffStops(bookings: readonly Booking[]): Stop[] {
  return confirmed(bookings).flatMap(({ id, dropoff, passenger }) =>
    dropoff?.point ? [{ id, point: dropoff.point, name: dropoff.name, who: passenger.firstName }] : [],
  );
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

// The driver moves a stop one place up or down.
export function withMoved(stops: readonly Stop[], index: number, by: -1 | 1): Stop[] {
  const target = index + by;
  const stop = stops[index];
  const other = stops[target];
  if (!stop || !other) return [...stops];
  const next = [...stops];
  next[index] = other;
  next[target] = stop;
  return next;
}

// The order the driver set by hand, as ids, kept while the app is away in a navigator (docs/94 C7).
export type HandOrder = { readonly pickups: readonly string[]; readonly dropoffs: readonly string[] };
const ids = (value: unknown): readonly string[] | null =>
  Array.isArray(value) && value.every((id) => typeof id === 'string') ? value : null;
export function handOrderOf(value: unknown): HandOrder | null {
  if (typeof value !== 'object' || value === null) return null;
  const { pickups, dropoffs } = value as Record<string, unknown>;
  const [up, down] = [ids(pickups), ids(dropoffs)];
  return up && down ? { pickups: up, dropoffs: down } : null;
}
const byIds = (stops: readonly Stop[], order: readonly string[]) =>
  [...stops].sort((a, b) => rank(order, a.id) - rank(order, b.id));
const rank = (order: readonly string[], id: string) => {
  const at = order.indexOf(id);
  return at === -1 ? order.length : at;
};
// A stop that came later goes to the end; a stop that is gone is skipped.
export function inHandOrder(stops: Record<StopKind, Stop[]>, order: HandOrder): Record<StopKind, Stop[]> {
  return { pickups: byIds(stops.pickups, order.pickups), dropoffs: byIds(stops.dropoffs, order.dropoffs) };
}
