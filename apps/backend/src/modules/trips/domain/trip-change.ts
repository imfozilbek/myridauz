import { DAY_MS, MAX_TRIP_SHIFT_MS, tashkentDate } from '@platform/contracts';
import { endsAt, isLive, type TripRecord } from './trip';

export type ChangeError = 'trips.not_found' | 'trips.wrong_status' | 'trips.invalid_input';

// Only the driver changes a trip, one that is live and has not left yet (docs/104).
function blocked(trip: TripRecord, driverId: number, now: number): ChangeError | null {
  if (trip.driverId !== driverId) return 'trips.not_found';
  return isLive(trip, now) && trip.departAt > now ? null : 'trips.wrong_status';
}

// Later only, at most +1 hour from the first time in all, the same day; the end moves along
// (docs/104, 8, owner decision 04.10.2026).
export function retime(
  trip: TripRecord,
  driverId: number,
  departAt: number,
  now: number,
): TripRecord | ChangeError {
  const error = blocked(trip, driverId, now);
  if (error) return error;
  const later = departAt > trip.departAt && departAt <= trip.firstDepartAt + MAX_TRIP_SHIFT_MS;
  if (!later || tashkentDate(departAt) !== tashkentDate(trip.firstDepartAt)) return 'trips.invalid_input';
  return { ...trip, departAt, endsAt: endsAt(departAt, trip.km) };
}

// Lower only, not below the bound of the route (docs/104, 9). A booking keeps its own price.
export function lowerPrice(
  trip: TripRecord,
  driverId: number,
  price: number,
  minPrice: number,
  now: number,
): TripRecord | ChangeError | 'trips.price_out_of_bounds' {
  const error = blocked(trip, driverId, now);
  if (error) return error;
  if (price >= trip.price) return 'trips.invalid_input';
  return price < minPrice ? 'trips.price_out_of_bounds' : { ...trip, price };
}

// A lower price is told to people at most once a day for a trip (docs/104).
export const priceNoticeDue = (trip: TripRecord, now: number) =>
  trip.priceToldAt === null || now - trip.priceToldAt >= DAY_MS;
