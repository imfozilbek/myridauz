import { MAX_REQUESTED_BOOKINGS, type Booking, type BookingInput } from '@platform/contracts';
import { answerDeadline, move, statusAt, type BookingRecord } from '../domain/booking';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';
import { chosenPoints, type PointsError } from './booking-points';
import { upcomingFirst } from '../../../shared/order/upcoming-first';

type RequestError =
  | 'bookings.not_found'
  | 'bookings.departed'
  | 'bookings.own_trip'
  | 'bookings.no_seats'
  | 'bookings.too_many'
  | 'bookings.wrong_status'
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
  // A trip that already left takes no seats: an old link or "Sevimli" opens it (docs/65 B8).
  if (facts.departAt <= now) return { ok: false, error: 'bookings.departed' };
  if (facts.driverId === passengerId) return { ok: false, error: 'bookings.own_trip' };
  const [trip] = await deps.trips.views([tripId]);
  if (!trip || trip.seatsLeft < seats) return { ok: false, error: 'bookings.no_seats' };
  const mine = await deps.bookings.byPassenger(passengerId);
  if (mine.some((booking) => booking.tripId === tripId && isHolding(booking, now)))
    return { ok: false, error: 'bookings.wrong_status' };
  if (mine.filter((booking) => isWaiting(booking, now)).length >= MAX_REQUESTED_BOOKINGS)
    return { ok: false, error: 'bookings.too_many' };
  const points = await chosenPoints(deps, trip, input);
  if (!points.ok) return points;
  const record: BookingRecord = {
    id: deps.newId(),
    tripId,
    passengerId,
    seats,
    price: facts.price,
    commission: deps.wallet.commission(facts.price, seats),
    status: 'requested',
    expiresAt: answerDeadline(facts.departAt, now),
    ...points.value,
    offerId: null,
    confirmedAt: null,
    boardedAt: null,
    arrivedAt: null,
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
  const next = move(record, 'passenger_cancel', deps.now(), facts.departAt);
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
  const views = await bookingViews(deps, await deps.bookings.byPassenger(passengerId), 'passenger');
  return upcomingFirst(views, (booking) => booking.trip.departAt, deps.now());
}
