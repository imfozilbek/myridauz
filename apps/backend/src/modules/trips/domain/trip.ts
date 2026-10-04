import {
  arrivalAt,
  DAY_MS,
  TRIP_DAYS_AHEAD,
  type Car,
  type PickupMode,
  type Trip,
} from '@platform/contracts';

// The car the team approved when the trip was published: a new check of the driver keeps it (docs/65 A1).
export type TripCar = Pick<Car, 'make' | 'model' | 'color' | 'plate'>;

// A published trip (docs/35). A new formula is only for new trips (docs/23); the driver may lower the
// price and move the time a little later (G39, docs/104).
export type TripRecord = {
  readonly id: string;
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // departAt + time on the road + 2 hours: then the trip is completed by itself (docs/35).
  readonly endsAt: number;
  readonly km: number;
  readonly seats: number;
  readonly price: number;
  readonly womanOnBoard: boolean;
  readonly comment: string;
  // null only for a trip of a deleted driver made before the car was kept in the trip.
  readonly car: TripCar | null;
  readonly status: Trip['status'];
  // How the driver picks people up (docs/70): the pitak of the direction, around the city, or both.
  // The driver sets no points: the system takes the pitak of the direction by itself.
  readonly pickupMode: PickupMode;
  readonly createdAt: number;
  // The time and price at the publishing, and the last notice of a lower price (G39, docs/104).
  readonly firstDepartAt: number;
  readonly firstPrice: number;
  readonly priceToldAt: number | null;
};

const AFTER_ARRIVAL_MS = 2 * 60 * 60 * 1000;

export const endsAt = (departAt: number, km: number) => arrivalAt(departAt, km) + AFTER_ARRIVAL_MS;

// The time of a new trip: in the future and not too far (docs/35).
export function departError(departAt: number, now: number): 'trips.in_past' | 'trips.invalid_input' | null {
  if (departAt <= now) return 'trips.in_past';
  return departAt > now + TRIP_DAYS_AHEAD * DAY_MS ? 'trips.invalid_input' : null;
}

// Active or full and not over yet: it counts for the limit of 5 and shows in the search.
export const isLive = (trip: TripRecord, now: number) =>
  (trip.status === 'active' || trip.status === 'full') && trip.endsAt > now;

// What the driver sees now, even before the Cron job has marked an old trip completed.
export const statusAt = (trip: TripRecord, now: number): Trip['status'] =>
  (trip.status === 'active' || trip.status === 'full') && trip.endsAt <= now ? 'completed' : trip.status;

// Only the driver cancels, only a trip that has not left yet (docs/35). A trip on the road keeps
// its confirmed seats, as a booking does after the departure (docs/65 A4, docs/83 N02).
export function cancel(
  trip: TripRecord,
  driverId: number,
  now: number,
): TripRecord | 'trips.not_found' | 'trips.wrong_status' {
  if (trip.driverId !== driverId) return 'trips.not_found';
  return isLive(trip, now) && trip.departAt > now ? { ...trip, status: 'cancelled' } : 'trips.wrong_status';
}
