import {
  BOOKING_ANSWER_HOURS,
  HOUR_MS,
  onTheWay,
  type BookingMode,
  type BookingStatus,
  type PlaceName,
  type Point,
} from '@platform/contracts';

// The names of a point found at the booking (docs/69): the exact one and the area around it.
export type Named = { readonly name: PlaceName | null; readonly area: PlaceName | null };

// A booking of seats on a trip (docs/35). The price and the commission stay as at the request.
export type BookingRecord = {
  readonly id: string;
  readonly tripId: string;
  readonly passengerId: number;
  readonly seats: number;
  // The whole car (docs/09) and «Men bilan ayol bor» (docs/06 rule 4), fixed at the booking (G59).
  readonly wholeCar: boolean;
  readonly withWoman: boolean;
  readonly price: number;
  readonly commission: number;
  readonly status: BookingStatus;
  readonly expiresAt: number;
  // How the passenger is picked up, fixed at the booking (docs/70): the pitak of the direction,
  // or the door with its point. The drop-off is always a point at the door.
  readonly mode: BookingMode | null;
  readonly pitakId: string | null;
  readonly pickup: Point | null;
  readonly pickupNamed: Named | null;
  readonly dropoff: Point | null;
  readonly dropoffNamed: Named | null;
  // The note of the passenger for the meeting, its contacts masked (docs/07); null: none or erased.
  readonly note: string | null;
  // The offer this booking came from: its chat is the offer's chat (docs/07).
  readonly offerId: string | null;
  // When the driver confirmed it (docs/88 L6); "Mashinaga chiqdim" and "Yetib keldim" of the passenger (docs/43).
  readonly confirmedAt: number | null;
  readonly boardedAt: number | null;
  readonly arrivedAt: number | null;
  readonly cameAt: number | null;
  // The driver at the point (docs/126, G63): «Men keldim», «Keldi», «Kelmadi»; never cleared.
  readonly driverCameAt: number | null;
  readonly metAt: number | null;
  readonly noShowAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
};

// A new booking: the driver has marked nothing at the point yet (G63).
export const NO_MARKS = { driverCameAt: null, metAt: null, noShowAt: null } as const;

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

// The points and their names go at once when the ride will not happen (docs/69): only the district
// of the route stays with the trip.
export const withoutPoints = (booking: BookingRecord): BookingRecord => ({
  ...booking,
  pickup: null,
  pickupNamed: null,
  dropoff: null,
  dropoffNamed: null,
  note: null,
});

// Who may move a booking where (docs/35). A cancelled request is "declined" when the driver does it.
const MOVES: Moves = {
  confirm: { requested: 'confirmed' },
  decline: { requested: 'declined' },
  passenger_cancel: { requested: 'cancelled_by_passenger', confirmed: 'cancelled_by_passenger' },
  driver_cancel: { requested: 'declined', confirmed: 'cancelled_by_driver' },
};

// After «Keldi» or «Kelmadi» of the driver the meeting is over (G63).
export const metOrMissed = (booking: BookingRecord) => booking.metAt !== null || booking.noShowAt !== null;

// A confirmed booking is not cancelled after the departure (by the clock or by «Yoʻlga chiqdim»), nor
// after the meeting: the ride happened or it is a complaint, never a refund by a tap (docs/35, docs/65 A4).
export function move(
  booking: BookingRecord,
  action: BookingAction,
  now: number,
  trip: { readonly departAt: number; readonly departedAt: number | null },
): BookingRecord | 'bookings.wrong_status' {
  const status = statusAt(booking, now, false);
  const over = onTheWay(trip, now) || metOrMissed(booking);
  if (status === 'confirmed' && action !== 'confirm' && over) return 'bookings.wrong_status';
  const next = MOVES[action][status];
  if (!next) return 'bookings.wrong_status';
  const moved = { ...booking, status: next, updatedAt: now };
  return next === 'confirmed' ? { ...moved, confirmedAt: now } : withoutPoints(moved);
}
