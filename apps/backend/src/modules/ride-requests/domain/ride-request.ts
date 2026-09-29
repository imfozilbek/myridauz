import {
  DAY_MS,
  tashkentDate,
  tashkentDayStart,
  TRIP_DAYS_AHEAD,
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
  readonly status: RideRequest['status'];
  readonly createdAt: number;
};

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
  return isOpen(request, now) ? { ...request, status: 'cancelled' } : 'trips.wrong_status';
}
