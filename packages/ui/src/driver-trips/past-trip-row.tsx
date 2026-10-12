import { tashkentDate, type Booking, type Trip } from '@platform/contracts';
import { useWayText } from '../market/way-line';
import { useEnds } from '../requests/ends';
import { useRequestDay } from '../requests/request-day';
import { PastTripTags } from '../trip-end/past-trip-tags';
import { DriverTripRow } from './driver-trip-row';
import './past-trip-row.css';

type Props = {
  readonly trip: Trip;
  // The bookings of this trip: what is left of it (G63, docs/129).
  readonly bookings: readonly Booking[];
  readonly now: number;
  readonly onOpen: () => void;
};

// A past trip in «Oʻtgan» is the row of «Faol» (G78 sheet 3): the short day, the short ends and the
// small arrow of «Faol» (owner decision 12.10.2026, spot 4), how people were taken in the words of its
// card, and what is left: the stars to give, a refund.
export function PastTripRow({ trip, bookings, now, onOpen }: Props) {
  const day = useRequestDay()(tashkentDate(trip.departAt));
  const ends = useEnds()(trip);
  const way = useWayText();
  return (
    <DriverTripRow trip={trip} day={day} {...ends} place={way(trip)} onOpen={onOpen}>
      <PastTripTags trip={trip} bookings={bookings} now={now} />
    </DriverTripRow>
  );
}
