import {
  HOUR_MS,
  onTheWay,
  tripArrival,
  type BookingStatus,
  type ShareStatus,
  type Trip,
} from '@platform/contracts';

// A passenger shares a booking; a driver shares a trip (docs/43, G18).
export type ShareKind = 'booking' | 'trip';
export type ShareSubject = { readonly kind: ShareKind; readonly id: string };

// A share link (docs/43). Only the hash of the token is kept.
export type ShareRecord = {
  readonly tokenHash: string;
  readonly subject: ShareSubject;
  readonly createdAt: number;
  readonly revokedAt: number | null;
};

const TOKEN_BYTES = 32;
// Close people see the trip until a day after the arrival (docs/43).
const OPEN_AFTER_ARRIVAL_MS = 24 * HOUR_MS;

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

// A random token nobody can guess: 32 bytes, 43 characters in a link.
export const newToken = () => toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));

export async function hashToken(token: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// The link stays open until a while after the arrival, counted from the end of a range (docs/216).
export const openUntil = (trip: Parameters<typeof tripArrival>[0]) =>
  tripArrival(trip) + OPEN_AFTER_ARRIVAL_MS;

type Progress = {
  readonly status: BookingStatus;
  readonly departAt: number;
  readonly departUntil: number | null;
  readonly departedAt: number | null;
  readonly boardedAt: number | null;
  readonly arrivedAt: number | null;
};

// What close people read about the trip (docs/43): the passenger's buttons, then «Yoʻlga chiqdim» of
// the driver or the clock (G63).
export function shareStatus(trip: Progress, now: number): ShareStatus {
  if (trip.status !== 'confirmed' && trip.status !== 'completed') return 'cancelled';
  if (trip.arrivedAt !== null) return 'arrived';
  if (trip.status === 'completed') return 'completed';
  if (onTheWay(trip, now)) return 'on_the_way';
  return trip.boardedAt === null ? 'waiting' : 'boarded';
}

type DriverProgress = Pick<Trip, 'status' | 'departAt' | 'departUntil' | 'departedAt' | 'arrivedAt' | 'km'>;

// The driver has no boarding step: the family reads «Yoʻlga chiqdim» and «Yetib keldik»
// (G63), the clock and the trip status.
export function driverShareStatus(trip: DriverProgress, now: number): ShareStatus {
  if (trip.status === 'cancelled') return 'cancelled';
  if (trip.arrivedAt !== null) return 'arrived';
  if (trip.status === 'completed' || now >= tripArrival(trip)) return 'completed';
  return onTheWay(trip, now) ? 'on_the_way' : 'waiting';
}
