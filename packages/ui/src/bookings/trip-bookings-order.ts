import type { Booking } from '@platform/contracts';

const TAKEN = new Set<Booking['status']>(['confirmed', 'completed']);

// The requests of a trip: the shortest extra way first (docs/70); among equal ways the one whose
// answer time ends first, so the driver answers it before it expires (docs/90 F-D11).
export const requestsInOrder = (requests: readonly Booking[]): Booking[] =>
  [...requests].sort((a, b) => (a.extraKm ?? 0) - (b.extraKm ?? 0) || a.expiresAt - b.expiresAt);

// The other bookings: the taken seats first, the cancelled, declined and expired ones after them.
export const takenFirst = (bookings: readonly Booking[]): Booking[] =>
  [...bookings].sort((a, b) => Number(TAKEN.has(b.status)) - Number(TAKEN.has(a.status)));
