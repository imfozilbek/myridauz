import {
  arrivalAt,
  MAX_REQUESTED_BOOKINGS,
  onTheWay,
  type Booking,
  type BookingInput,
} from '@platform/contracts';
import { answerDeadline, move, statusAt, type BookingRecord } from '../domain/booking';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';
import { chosenPoints, type PointsError } from './booking-points';
import { keepsWithWoman, seatChoiceError, type ChoiceError } from '../domain/seat-choice';
import { upcomingFirst } from '../../../shared/order/upcoming-first';

type RequestError =
  | 'bookings.not_found'
  | 'bookings.departed'
  | 'bookings.own_trip'
  | 'bookings.no_seats'
  | 'bookings.too_many'
  | 'bookings.wrong_status'
  | ChoiceError
  | PointsError;

const isWaiting = (booking: BookingRecord, now: number) => statusAt(booking, now, false) === 'requested';
const isHolding = (booking: BookingRecord, now: number) =>
  isWaiting(booking, now) || booking.status === 'confirmed';

// A passenger asks for seats (docs/35): a live trip of someone else, enough free seats,
// one booking per trip, at most 3 waiting requests at once; the way and the points fixed (docs/70).
export async function requestBooking(
  deps: BookingsDeps,
  passengerId: number,
  tripId: string,
  input: BookingInput,
): Promise<Result<Booking, RequestError>> {
  const { seats } = input;
  const now = deps.now();
  const facts = await deps.trips.find(tripId);
  if (!facts?.live) return { ok: false, error: 'bookings.not_found' };
  // A trip that already left takes no seats: an old link or "Sevimli" opens it (docs/65 B8). An early
  // «Yoʻlga chiqdim» of the driver counts too (G63).
  if (onTheWay(facts, now)) return { ok: false, error: 'bookings.departed' };
  if (facts.driverId === passengerId) return { ok: false, error: 'bookings.own_trip' };
  const [trip] = await deps.trips.views([tripId]);
  if (!trip || trip.seatsLeft < seats) return { ok: false, error: 'bookings.no_seats' };
  const choiceError = seatChoiceError(trip, input);
  if (choiceError) return { ok: false, error: choiceError };
  const mine = await deps.bookings.byPassenger(passengerId);
  if (mine.some((booking) => booking.tripId === tripId && isHolding(booking, now)))
    return { ok: false, error: 'bookings.wrong_status' };
  if (mine.filter((booking) => isWaiting(booking, now)).length >= MAX_REQUESTED_BOOKINGS)
    return { ok: false, error: 'bookings.too_many' };
  const points = await chosenPoints(deps, trip, input);
  if (!points.ok) return points;
  const passenger = await deps.people.find(passengerId);
  const record: BookingRecord = {
    id: deps.newId(),
    tripId,
    passengerId,
    seats,
    wholeCar: input.wholeCar ?? false,
    withWoman: keepsWithWoman(trip, input, passenger?.gender === 'female'),
    price: facts.price,
    commission: deps.wallet.commission(facts.price, seats),
    status: 'requested',
    expiresAt: answerDeadline(facts.departAt, now),
    ...points.value,
    offerId: null,
    confirmedAt: null,
    boardedAt: null,
    arrivedAt: null,
    cameAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await deps.bookings.save(record);
  const [forDriver] = await bookingViews(deps, [record], 'driver');
  if (forDriver) await deps.notify.requested(forDriver);
  const [view] = await bookingViews(deps, [record], 'passenger');
  return view ? { ok: true, value: view } : { ok: false, error: 'bookings.not_found' };
}

// The passenger cancels: a waiting request simply ends; a confirmed booking gives the commission
// back to the driver (docs/12).
export async function cancelByPassenger(
  deps: BookingsDeps,
  passengerId: number,
  id: string,
): Promise<Result<Booking, 'bookings.not_found' | 'bookings.wrong_status'>> {
  const record = await deps.bookings.find(id);
  const facts = record ? await deps.trips.find(record.tripId) : undefined;
  if (record?.passengerId !== passengerId || !facts) return { ok: false, error: 'bookings.not_found' };
  const next = move(record, 'passenger_cancel', deps.now(), facts);
  if (typeof next === 'string') return { ok: false, error: next };
  if (!(await deps.bookings.replace(next, record.status)))
    return { ok: false, error: 'bookings.wrong_status' };
  // A cancelled confirmed booking gives the commission back (docs/12, owner decision 29.09.2026).
  if (record.status === 'confirmed') await deps.wallet.refund(facts.driverId, id);
  const [forDriver] = await bookingViews(deps, [next], 'driver');
  if (forDriver) await deps.notify.cancelled(forDriver, 'passenger');
  const [view] = await bookingViews(deps, [next], 'passenger');
  return view ? { ok: true, value: view } : { ok: false, error: 'bookings.not_found' };
}

// "Mening safarlarim" of a passenger: the trips ahead first, then the past ones (docs/65 B6).
export async function passengerBookings(deps: BookingsDeps, passengerId: number): Promise<Booking[]> {
  const [records, rated] = await Promise.all([
    deps.bookings.byPassenger(passengerId),
    deps.rated(passengerId),
  ]);
  const seen = await bookingViews(deps, records, 'passenger');
  const views = seen.map((view) => ({ ...view, rated: rated.has(view.id) }));
  // A live seat on the road stays on top until the arrival (docs/90 F-D3).
  const arrival = ({ status, trip }: Booking) =>
    status === 'requested' || status === 'confirmed' ? arrivalAt(trip.departAt, trip.km) : trip.departAt;
  return upcomingFirst(views, (booking) => booking.trip.departAt, deps.now(), arrival);
}
