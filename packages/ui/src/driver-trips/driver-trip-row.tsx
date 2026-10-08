import { tashkentDate, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useEnds } from '../requests/ends';
import { useRequestDay } from '../requests/request-day';
import { WAYS } from '../requests/request-marks';
import './driver-trips.css';

const CHEVRON = 10;

type Props = {
  readonly trip: Trip;
  // New requests for a seat that wait for the answer of the driver (G41, docs/90 F-D4).
  readonly requests: number;
  // «Qaytish safari» in place of the pitak (mockup g64/6).
  readonly wayBack: boolean;
  readonly onOpen: () => void;
};

// One live trip of a driver (G64, mockup g64/6): when, the route, where people are taken and the
// price of a seat, then the marks: new requests, free seats or «Hamma joy band». A tap opens
// «Mening safarim» (path 6).
export function DriverTripRow({ trip, requests, wayBack, onOpen }: Props) {
  const { t, formatTime, formatNumber } = useI18n();
  const day = useRequestDay();
  const ends = useEnds()(trip);
  const place = wayBack ? t('driverTrip.row.back') : (trip.pitak?.name ?? t(WAYS[trip.pickupMode]));
  return (
    <button type="button" className="driver-trip" onClick={onOpen}>
      <span className="driver-trip-text">
        <b className="driver-trip-when">
          {t('driverTrip.row.when', {
            day: day(tashkentDate(trip.departAt)),
            time: formatTime(new Date(trip.departAt)),
          })}
        </b>
        <span className="driver-trip-route">{t('requests.card.route', ends)}</span>
        <span className="driver-trip-sub">
          {t('driverTrip.row.sub', { place, price: formatNumber(trip.price) })}
        </span>
        <span className="driver-trip-tags">
          {requests > 0 ? (
            <span className="driver-tag driver-tag-new">{t('home.requests', { count: requests })}</span>
          ) : null}
          {trip.seatsLeft > 0 ? (
            <span className="driver-tag">{t('driverTrip.row.free', { count: trip.seatsLeft })}</span>
          ) : (
            <span className="driver-tag driver-tag-full">{t('driverTrip.row.full')}</span>
          )}
        </span>
      </span>
      <Icon name="next" size={CHEVRON} />
    </button>
  );
}
