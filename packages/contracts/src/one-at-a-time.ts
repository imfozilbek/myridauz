import { tripEndsAt } from './after-trip';
import type { BookingStatus } from './bookings';
import type { Trip } from './trips';

// One at a time (owner decision 12.10.2026, docs/172): a driver has one live trip, a passenger one
// thing, an open request or a seat. It closes the rest, so a person never gets lost (docs/127).
// The server and the Mini Apps count by these rules alone.

// A trip holds its driver until «Yetib keldik», a cancel or its end: the way back is free (G78 В11).
export const tripHolds = (trip: Pick<Trip, 'status' | 'departAt' | 'km' | 'arrivedAt'>, now: number) =>
  (trip.status === 'active' || trip.status === 'full') &&
  trip.arrivedAt === null &&
  now < tripEndsAt(trip.departAt, trip.km);

type Seat = {
  readonly status: BookingStatus;
  readonly expiresAt: number;
  readonly arrivedAt: number | null;
  readonly noShowAt: number | null;
};

// A seat holds its passenger while its trip holds the driver, until her own «Yetib keldim» or
// «Kelmadi»; an ask without an answer only until its time to answer (docs/35).
export const seatHolds = (seat: Seat, tripHeld: boolean, now: number) =>
  tripHeld &&
  seat.arrivedAt === null &&
  seat.noShowAt === null &&
  (seat.status === 'confirmed' || (seat.status === 'requested' && seat.expiresAt > now));
