import type { BookingRecord } from '../domain/booking';
import type { BookingsDeps } from './ports';

// The money after the seat (docs/65 A4). A seat cancelled between the two found no commission to give
// back: it goes back here at once, and the seat counts as gone (G89 M2).
export async function chargeSeat(
  deps: BookingsDeps,
  driverId: number,
  booking: BookingRecord,
): Promise<'ok' | 'not_enough' | 'gone'> {
  // 'duplicate': this seat was charged before; the money is there as for 'ok'.
  if ((await deps.wallet.charge(driverId, booking.id, booking.commission)) === 'not_enough')
    return 'not_enough';
  if ((await deps.bookings.find(booking.id))?.status === 'confirmed') return 'ok';
  await deps.wallet.refund(driverId, booking.id);
  return 'gone';
}
