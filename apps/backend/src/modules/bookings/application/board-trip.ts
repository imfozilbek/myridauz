import type { Point, Stops, Trip } from '@platform/contracts';
import type { BookingsDeps } from './ports';

// The trip the board of requests fills (G64, «Safaringizga mos»): the nearest trip of the driver not on
// the road yet, open to everybody, with a free seat. Its stops: the pitak and the points of the
// confirmed passengers (docs/70), the extra way of a new request is measured to them.
export async function boardTrip(
  deps: BookingsDeps,
  driverId: number,
): Promise<{ readonly trip: Trip; readonly stops: Stops } | null> {
  const now = deps.now();
  const live = (await deps.trips.views(await deps.trips.ofDriver(driverId)))
    .filter(
      (trip) => trip.status === 'active' && !trip.private && trip.departedAt === null && trip.departAt > now,
    )
    .sort((a, b) => a.departAt - b.departAt);
  const [trip] = live;
  if (!trip) return null;
  const riding = (await deps.bookings.byTrips([trip.id])).filter((booking) => booking.status === 'confirmed');
  const pointsOf = (key: 'pickup' | 'dropoff'): Point[] =>
    riding.flatMap((booking) => (booking[key] ? [booking[key]] : []));
  const pickups = [...(trip.pitak ? [trip.pitak.point] : []), ...pointsOf('pickup')];
  return { trip, stops: { pickups, dropoffs: pointsOf('dropoff') } };
}
