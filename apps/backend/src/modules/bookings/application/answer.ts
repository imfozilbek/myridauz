import type { Booking } from '@platform/contracts';
import { move, statusAt, type BookingAction, type BookingRecord } from '../domain/booking';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';

type AnswerError = 'bookings.not_found' | 'bookings.wrong_status' | 'bookings.no_seats' | 'wallet.not_enough';

async function mine(deps: BookingsDeps, driverId: number, id: string) {
  const record = await deps.bookings.find(id);
  const facts = record ? await deps.trips.find(record.tripId) : undefined;
  return record && facts?.driverId === driverId ? record : undefined;
}

async function driverView(deps: BookingsDeps, record: BookingRecord): Promise<Result<Booking, AnswerError>> {
  const [view] = await bookingViews(deps, [record], 'driver');
  return view ? { ok: true, value: view } : { ok: false, error: 'bookings.not_found' };
}

// The driver confirms (docs/12, docs/35): the commission is taken now, the bonus first.
// Without money there is no confirmation. The same booking is never charged twice.
export async function confirm(
  deps: BookingsDeps,
  driverId: number,
  id: string,
): Promise<Result<Booking, AnswerError>> {
  const record = await mine(deps, driverId, id);
  if (!record) return { ok: false, error: 'bookings.not_found' };
  if (statusAt(record, deps.now(), false) !== 'requested')
    return { ok: false, error: 'bookings.wrong_status' };
  const [trip] = await deps.trips.views([record.tripId]);
  if (!trip || trip.seatsLeft < record.seats) return { ok: false, error: 'bookings.no_seats' };
  const charged = await deps.wallet.charge(driverId, id, record.commission);
  if (charged === 'not_enough') return { ok: false, error: 'wallet.not_enough' };
  if (charged === 'duplicate') return { ok: false, error: 'bookings.wrong_status' };
  const next: BookingRecord = { ...record, status: 'confirmed', updatedAt: deps.now() };
  if (!(await deps.bookings.replace(next, 'requested'))) {
    // The passenger cancelled in the same moment: the commission goes back.
    await deps.wallet.refund(driverId, id);
    return { ok: false, error: 'bookings.wrong_status' };
  }
  const [forPassenger] = await bookingViews(deps, [next], 'passenger');
  if (forPassenger) await deps.notify.confirmed(forPassenger);
  return driverView(deps, next);
}

// A "no" to a request, or a cancel of a confirmed booking: the commission goes back to the wallet
// (docs/12, owner decision 29.09.2026).
export async function answer(
  deps: BookingsDeps,
  driverId: number,
  id: string,
  action: Extract<BookingAction, 'decline' | 'driver_cancel'>,
): Promise<Result<Booking, AnswerError>> {
  const record = await mine(deps, driverId, id);
  if (!record) return { ok: false, error: 'bookings.not_found' };
  const next = move(record, action, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  if (!(await deps.bookings.replace(next, record.status)))
    return { ok: false, error: 'bookings.wrong_status' };
  if (record.status === 'confirmed') await deps.wallet.refund(driverId, id);
  const [forPassenger] = await bookingViews(deps, [next], 'passenger');
  if (forPassenger) {
    if (next.status === 'declined') await deps.notify.declined(forPassenger);
    else await deps.notify.cancelled(forPassenger, 'driver');
  }
  return driverView(deps, next);
}

// Bookings on the driver's trips, the newest first.
export async function driverBookings(deps: BookingsDeps, driverId: number): Promise<Booking[]> {
  const records = await deps.bookings.byTrips(await deps.trips.ofDriver(driverId));
  return bookingViews(
    deps,
    [...records].sort((a, b) => b.createdAt - a.createdAt),
    'driver',
  );
}

// The team looks at the bookings of a trip (owner decision 29.09.2026: trips are not approved).
export const teamTripBookings = async (deps: BookingsDeps, tripId: string) =>
  bookingViews(deps, await deps.bookings.byTrips([tripId]), 'team');
