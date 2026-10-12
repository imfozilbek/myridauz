import type { Booking } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import { useBookingEnds } from '../../trip/booking-ends';
import { DockCard, type DockTool } from './dock-card';
import type { DockWords } from './dock-words';

type Props = { readonly booking: Booking; readonly words: DockWords; readonly tools: readonly DockTool[] };

// The meeting of a seat (G76, mockup g76/2 state 9): when, the minutes left, where to stand, the
// driver with the chat and the call. One card in the block and on the page of the seat (G78 sheet 2).
export function SeatMeetCard({ booking, words, tools }: Props) {
  const { t } = useI18n();
  const ends = useBookingEnds(booking);
  const { trip } = booking;
  const driver = trip.driver;
  // Where exactly to stand at the pitak (the team writes it), else the region; the driver on the way
  // after «Yoʻlga chiqdim», without minutes (owner decision 10.10.2026: no live car, lesson 2).
  const where = booking.pitak?.hint ?? ends.regionName(trip.from);
  // On the way between «Yoʻlga chiqdim» and the driver's «Men keldim» at the point.
  const coming = trip.departedAt !== null && booking.driverCameAt === null;
  const onWay = t('home.dock.onWay', { name: driver.firstName });
  return (
    <DockCard
      chip={words.when(trip.departAt)}
      tone="soon"
      timer={{ text: words.minutesTo(trip.departAt), now: false }}
      title={ends.start}
      text={coming ? t('home.meta', { when: where, more: onWay }) : where}
      who={{ person: driver, sub: words.car(driver.car, booking.plate), tools }}
    />
  );
}
