import type { Trip } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useTripTime } from '../trip/trip-time';
import './driver-trips.css';

const CHEVRON = 10;

type Props = {
  readonly trip: Trip;
  // The day and the ends by their short names, live and past alike (owner decision 12.10.2026).
  readonly day: string;
  readonly from: string;
  readonly to: string;
  // Where people are taken: the pitak of a live trip, the words of the card on a past one.
  readonly place: string;
  readonly onOpen: () => void;
  // The marks under the row.
  readonly children: ReactNode;
};

// One trip of a driver (G64, mockup g64/6), live in «Faol» and past in «Oʻtgan» (G78 sheet 3): when,
// the route, where people are taken and the price of a seat, then its marks. A tap opens «Mening
// safarim» (path 6).
export function DriverTripRow(props: Props) {
  const { trip, day, from, to, place, onOpen, children } = props;
  const { t, formatNumber } = useI18n();
  const tripTime = useTripTime();
  return (
    <button type="button" className="driver-trip" onClick={onOpen}>
      <span className="driver-trip-text">
        <b className="driver-trip-when">{t('driverTrip.row.when', { day, time: tripTime(trip) })}</b>
        <span className="driver-trip-route">{t('requests.card.route', { from, to })}</span>
        <span className="driver-trip-sub">
          {t('driverTrip.row.sub', { place, price: formatNumber(trip.price) })}
        </span>
        <span className="driver-trip-tags">{children}</span>
      </span>
      <Icon name="next" size={CHEVRON} />
    </button>
  );
}
