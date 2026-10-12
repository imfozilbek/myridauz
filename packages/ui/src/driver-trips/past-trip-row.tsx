import type { Booking, Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { usePlaceLabel } from '../market/places-gate';
import { useWayText } from '../market/way-line';
import { PastTripTags } from '../trip-end/past-trip-tags';
import { DriverTripRow } from './driver-trip-row';
import './past-trip-row.css';

// The arrow of a past row is the one of the mockup (G78 sheet 3).
const CHEVRON = 18;

type Props = {
  readonly trip: Trip;
  // The bookings of this trip: what is left of it (G63, docs/129).
  readonly bookings: readonly Booking[];
  readonly now: number;
  readonly onOpen: () => void;
};

// A past trip in «Oʻtgan» is the row of «Faol» (G78 sheet 3): the day, the ends and how people were
// taken in the words of its card, and what is left: the stars to give, a refund.
export function PastTripRow({ trip, bookings, now, onOpen }: Props) {
  const { formatDate } = useI18n();
  const place = usePlaceLabel();
  const way = useWayText();
  return (
    <DriverTripRow
      trip={trip}
      day={formatDate(new Date(trip.departAt))}
      from={place(trip.from).name}
      to={place(trip.to).name}
      place={way(trip)}
      chevron={CHEVRON}
      onOpen={onOpen}
    >
      <PastTripTags trip={trip} bookings={bookings} now={now} />
    </DriverTripRow>
  );
}
