import { commonModes, insideUzbekistan, type BookingInput, type Point, type Trip } from '@platform/contracts';
import type { Named } from '../domain/booking';
import type { BookingsDeps } from './ports';

// The way and the points of a new booking (docs/70): the way must suit the trip; «Pitakdan» needs
// the pitak of the direction; «Uyimdan» needs a point in the district of the start; the drop-off
// is always a point in the district of the end. The names are found once and kept (docs/69).
export type PointsError = 'bookings.wrong_mode' | 'bookings.outside_country' | 'bookings.outside_area';
type Chosen = {
  readonly mode: 'pitak' | 'door';
  readonly pitakId: string | null;
  readonly pickup: Point | null;
  readonly pickupNamed: Named | null;
  readonly dropoff: Point;
  readonly dropoffNamed: Named | null;
};

const plain = ({ lat, lng }: Point) => ({ lat, lng });

async function named(deps: BookingsDeps, point: Point): Promise<Named> {
  const { name, area } = await deps.places.describe(point);
  return { name, area };
}

function pointError(deps: BookingsDeps, point: Point, placeId: string): PointsError | null {
  if (!insideUzbekistan(point)) return 'bookings.outside_country';
  return deps.places.fits(point, placeId) ? null : 'bookings.outside_area';
}

export async function chosenPoints(
  deps: BookingsDeps,
  trip: Trip,
  input: Pick<BookingInput, 'mode' | 'pickup' | 'dropoff'>,
): Promise<{ ok: true; value: Chosen } | { ok: false; error: PointsError }> {
  if (!commonModes(trip.pickupMode, input.mode).includes(input.mode))
    return { ok: false, error: 'bookings.wrong_mode' };
  if (input.mode === 'pitak' && !trip.pitak) return { ok: false, error: 'bookings.wrong_mode' };
  if (input.mode === 'door' && !input.pickup) return { ok: false, error: 'bookings.wrong_mode' };
  const pickup = input.mode === 'door' && input.pickup ? plain(input.pickup) : null;
  const errors = [pickup && pointError(deps, pickup, trip.from), pointError(deps, input.dropoff, trip.to)];
  const error = errors.find((each) => each);
  if (error) return { ok: false, error };
  const dropoff = plain(input.dropoff);
  const [pickupNamed, dropoffNamed] = await Promise.all([
    pickup && named(deps, pickup),
    named(deps, dropoff),
  ]);
  const pitakId = input.mode === 'pitak' ? (trip.pitak?.id ?? null) : null;
  return { ok: true, value: { mode: input.mode, pitakId, pickup, pickupNamed, dropoff, dropoffNamed } };
}
