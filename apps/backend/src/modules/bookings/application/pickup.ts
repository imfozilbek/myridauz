import { insideUzbekistan, type Booking, type Point } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';

type PickupError = 'bookings.not_found' | 'bookings.wrong_status' | 'bookings.outside_country';

// The bot sent the confirmation: the passenger answers that very message with the pickup point.
export async function rememberPickupMessage(deps: BookingsDeps, bookingId: string, messageId: number) {
  const booking = await deps.bookings.find(bookingId);
  if (booking) await deps.bookings.save({ ...booking, pickupMessageId: messageId });
}

// One way for the bot and the map (docs/14): only a confirmed booking of this passenger takes a
// point in Uzbekistan; the driver sees it in the booking and hears of it at once (docs/65 C).
async function savePickup(
  deps: BookingsDeps,
  passengerId: number,
  booking: BookingRecord | undefined,
  point: Point,
): Promise<Result<Booking, PickupError>> {
  if (booking?.passengerId !== passengerId) return { ok: false, error: 'bookings.not_found' };
  if (booking.status !== 'confirmed') return { ok: false, error: 'bookings.wrong_status' };
  if (!insideUzbekistan(point)) return { ok: false, error: 'bookings.outside_country' };
  const saved = { ...booking, pickup: { lat: point.lat, lng: point.lng }, updatedAt: deps.now() };
  await deps.bookings.save(saved);
  const [forDriver] = await bookingViews(deps, [saved], 'driver');
  if (forDriver) await deps.notify.pickup(forDriver);
  const [forPassenger] = await bookingViews(deps, [saved], 'passenger');
  return forPassenger ? { ok: true, value: forPassenger } : { ok: false, error: 'bookings.not_found' };
}

// A location the passenger sent to the passenger bot as an answer to the confirmation (docs/14).
export async function setPickup(
  deps: BookingsDeps,
  passengerId: number,
  messageId: number,
  point: Point,
): Promise<boolean> {
  const booking = await deps.bookings.byPickupMessage(passengerId, messageId);
  return (await savePickup(deps, passengerId, booking, point)).ok;
}

// The point the passenger put the pin on, on the map of the Mini App (G22).
export async function pickupFromMap(deps: BookingsDeps, passengerId: number, id: string, point: Point) {
  return savePickup(deps, passengerId, await deps.bookings.find(id), point);
}
