import { BOOKING_ANSWER_HOURS, type BookingStatus, type Point } from '@platform/contracts';

// A booking of seats on a trip (docs/35). The price and the commission stay as at the request.
export type BookingRecord = {
  readonly id: string;
  readonly tripId: string;
  readonly passengerId: number;
  readonly seats: number;
  readonly price: number;
  readonly commission: number;
  readonly status: BookingStatus;
  readonly expiresAt: number;
  // The passenger's own pickup point, sent to the passenger bot after the confirmation (docs/14).
  readonly pickup: Point | null;
  readonly pickupMessageId: number | null;
  // The offer this booking came from: its chat is the offer's chat (docs/07).
  readonly offerId: string | null;
  // "Mashinaga chiqdim" and "Yetib keldim" of the passenger (docs/43).
  readonly boardedAt: number | null;
  readonly arrivedAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
};

const HOUR_MS = 60 * 60 * 1000;
// An answer is waited for 24 hours, but never after the departure (docs/35).
export const answerDeadline = (departAt: number, now: number) =>
  Math.min(now + BOOKING_ANSWER_HOURS * HOUR_MS, departAt);

// A request whose time is over reads as expired even before the Cron job writes it.
export const statusAt = (booking: BookingRecord, now: number, tripOver: boolean): BookingStatus => {
  if (booking.status === 'requested' && booking.expiresAt <= now) return 'expired';
  return booking.status === 'confirmed' && tripOver ? 'completed' : booking.status;
};

// Only a confirmed booking holds seats, gives "ayol bor" and opens the places (docs/06, docs/07).
export const holdsSeats = (status: BookingStatus) => status === 'confirmed' || status === 'completed';

export type BookingAction = 'confirm' | 'decline' | 'passenger_cancel' | 'driver_cancel';
type Moves = Readonly<Record<BookingAction, Partial<Record<BookingStatus, BookingStatus>>>>;

// Who may move a booking where (docs/35). A cancelled request is "declined" when the driver does it.
const MOVES: Moves = {
  confirm: { requested: 'confirmed' },
  decline: { requested: 'declined' },
  passenger_cancel: { requested: 'cancelled_by_passenger', confirmed: 'cancelled_by_passenger' },
  driver_cancel: { requested: 'declined', confirmed: 'cancelled_by_driver' },
};

export function move(
  booking: BookingRecord,
  action: BookingAction,
  now: number,
): BookingRecord | 'bookings.wrong_status' {
  const status = statusAt(booking, now, false);
  const next = MOVES[action][status];
  return next ? { ...booking, status: next, updatedAt: now } : 'bookings.wrong_status';
}
