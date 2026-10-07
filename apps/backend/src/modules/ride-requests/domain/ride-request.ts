import {
  DAY_MS,
  tashkentDate,
  tashkentDayStart,
  TRIP_DAYS_AHEAD,
  type PickupMode,
  type Point,
  type RideRequest,
} from '@platform/contracts';

// "Ищу поездку" (docs/35): open until the day of the trip is over in Tashkent.
export type RequestRecord = {
  readonly id: string;
  readonly passengerId: number;
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly expiresAt: number;
  readonly km: number;
  readonly seats: number;
  readonly price: number;
  readonly wholeCar: boolean;
  readonly withWoman: boolean;
  readonly status: RideRequest['status'];
  // The way and the points of the passenger (docs/70): kept only while the request is open.
  readonly pickupMode: PickupMode;
  readonly pickup: Point | null;
  readonly dropoff: Point | null;
  readonly createdAt: number;
};

// A request that is no longer open keeps no points: a booking took them or nobody needs them (docs/69).
export const withoutPoints = (request: RequestRecord): RequestRecord => ({
  ...request,
  pickup: null,
  dropoff: null,
});

export const expiresAt = (date: string) => tashkentDayStart(date) + DAY_MS;

// Today or a later day, not too far (the same window as trips).
export function dateError(date: string, now: number): 'trips.in_past' | 'trips.invalid_input' | null {
  if (date < tashkentDate(now)) return 'trips.in_past';
  return tashkentDayStart(date) > now + TRIP_DAYS_AHEAD * DAY_MS ? 'trips.invalid_input' : null;
}

export const isOpen = (request: RequestRecord, now: number) =>
  request.status === 'open' && request.expiresAt > now;

// What people see now, even before the Cron job has marked an old request expired.
export const statusAt = (request: RequestRecord, now: number): RideRequest['status'] =>
  request.status === 'open' && request.expiresAt <= now ? 'expired' : request.status;

export function cancel(
  request: RequestRecord,
  passengerId: number,
  now: number,
): RequestRecord | 'trips.not_found' | 'trips.wrong_status' {
  if (request.passengerId !== passengerId) return 'trips.not_found';
  return isOpen(request, now) ? withoutPoints({ ...request, status: 'cancelled' }) : 'trips.wrong_status';
}

// «Men bilan ayol bor» (docs/06 rule 4): a man with 2 people and more; a woman gives the mark herself.
export const keepsWithWoman = (wanted: boolean, seats: number, passengerIsWoman: boolean) =>
  wanted && seats >= 2 && !passengerIsWoman;
