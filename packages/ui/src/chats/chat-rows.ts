import { DAY_MS, type Booking, type Offer } from '@platform/contracts';
import { otherSide } from '../call/other-side';
import { wayOf } from './chat-way';
import type { Unread } from './unread-chats';

// One chat of «Suhbatlar» (G76, mockup g76/5): who, the trip it is about, the unread words.
export type ChatRow = {
  readonly key: string;
  readonly person: { readonly id: string; readonly firstName: string; readonly hasAvatar: boolean };
  readonly at: number;
  readonly from: string;
  readonly to: string;
  // A request has a day, not a time.
  readonly day: boolean;
  readonly unread: Unread | null;
};

// The contacts stay a week after the trip (docs/129).
const AFTER_DAYS = 7;
const LIVE: readonly Booking['status'][] = ['requested', 'confirmed'];

const shownBooking = (booking: Booking, now: number) =>
  LIVE.includes(booking.status) ||
  (booking.status === 'completed' && now - booking.trip.departAt < AFTER_DAYS * DAY_MS);

type Sources = {
  readonly bookings: readonly Booking[];
  readonly offers: readonly Offer[];
  readonly unread: readonly Unread[];
  readonly driver: boolean;
  readonly now: number;
};

// The chats of the live seats and the week after, the offers waiting, and any unread talk; the
// unread first, the newest on top, then the nearest trips, then the past ones.
export function chatRows({ bookings, offers, unread, driver, now }: Sources): readonly ChatRow[] {
  const words = new Map(unread.map((one) => [one.key, one]));
  const rows = new Map<string, ChatRow>();
  const add = (row: Omit<ChatRow, 'unread'>) =>
    rows.set(row.key, { ...row, unread: words.get(row.key) ?? null });
  for (const booking of bookings.filter((one) => shownBooking(one, now))) {
    const { trip } = booking;
    const person = driver ? booking.passenger : trip.driver;
    add({ key: booking.chatKey, person, at: trip.departAt, from: trip.from, to: trip.to, day: false });
  }
  // A driver talks with the passenger who got the offer, a passenger with the driver (mockup g76/5).
  for (const offer of offers.filter((one) => one.status === 'sent')) {
    const person = driver ? offer.passenger : offer.driver;
    if (person)
      add({ key: offer.chatKey, person, at: offer.departAt, from: offer.from, to: offer.to, day: false });
  }
  for (const one of unread) {
    const person = otherSide(one.about);
    const way = wayOf(one.about);
    if (!rows.has(one.key) && person && way)
      add({ key: one.key, person, at: way.at, from: way.from, to: way.to, day: Boolean(way.day) });
  }
  return [...rows.values()].sort(order(now));
}

const order = (now: number) => (a: ChatRow, b: ChatRow) => {
  if (a.unread || b.unread) return (b.unread?.at ?? 0) - (a.unread?.at ?? 0);
  const ahead = (row: ChatRow) => row.at >= now;
  if (ahead(a) !== ahead(b)) return ahead(a) ? -1 : 1;
  return ahead(a) ? a.at - b.at : b.at - a.at;
};
