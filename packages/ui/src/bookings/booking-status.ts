import type { Booking, BookingStatus } from '@platform/contracts';

// A booking that can still be cancelled by the person.
export const cancellable = (status: BookingStatus) => status === 'requested' || status === 'confirmed';

// The status a person reads: «Yetib keldim» of the passenger or «Yetib keldik» of the driver ends the
// ride at once (docs/129), though the server keeps the seat confirmed until the end time (G90 PAS-7).
export const shownStatus = ({ status, arrivedAt, trip }: Booking): BookingStatus =>
  status === 'confirmed' && (arrivedAt !== null || trip.arrivedAt !== null) ? 'completed' : status;
