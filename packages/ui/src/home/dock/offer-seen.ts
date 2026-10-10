import { chatKeyOfOffer, DAY_MS, type Booking } from '@platform/contracts';
import { readStored, writeStored } from '../../telegram/device-storage';

// «Madina rozi boʻldi» (G76, mockup g76/3 state 9): a booking made from an offer of the driver is
// told once in the block, on any phone of the person (docs/164: the answer sheet is gone).
const KEY = 'offers_accepted_seen';
const KEPT = 50;

const seen = (): readonly string[] => {
  const value = readStored(KEY);
  return value ? value.split(',') : [];
};

export function markOfferSeen(bookingId: string) {
  writeStored(KEY, [bookingId, ...seen()].slice(0, KEPT).join(','));
}

// The bookings of offers confirmed in the last day and not told yet.
export function unseenOffers(bookings: readonly Booking[], now: number): ReadonlySet<string> {
  const told = new Set(seen());
  const fresh = bookings.filter(
    (booking) =>
      booking.status === 'confirmed' &&
      booking.chatKey.startsWith(chatKeyOfOffer('')) &&
      booking.confirmedAt !== null &&
      now - booking.confirmedAt < DAY_MS &&
      !told.has(booking.id),
  );
  return new Set(fresh.map((booking) => booking.id));
}
