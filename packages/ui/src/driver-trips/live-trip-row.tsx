import { tashkentDate, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useEnds } from '../requests/ends';
import { WAYS } from '../requests/request-marks';
import { useRequestDay } from '../requests/request-day';
import { DriverTripRow } from './driver-trip-row';

type Props = {
  readonly trip: Trip;
  // New requests for a seat that wait for the answer of the driver (G41, docs/90 F-D4).
  readonly requests: number;
  // «Qaytish safari» in place of the pitak (mockup g64/6).
  readonly wayBack: boolean;
  readonly onOpen: () => void;
};

// A live trip in «Faol» (G64, mockup g64/6): the new requests, free seats or «Hamma joy band».
export function LiveTripRow({ trip, requests, wayBack, onOpen }: Props) {
  const { t } = useI18n();
  const day = useRequestDay()(tashkentDate(trip.departAt));
  const ends = useEnds()(trip);
  const place = wayBack ? t('driverTrip.row.back') : (trip.pitak?.name ?? t(WAYS[trip.pickupMode]));
  return (
    <DriverTripRow trip={trip} day={day} {...ends} place={place} onOpen={onOpen}>
      {requests > 0 ? (
        <span className="driver-tag driver-tag-new">{t('home.requests', { count: requests })}</span>
      ) : null}
      {trip.seatsLeft > 0 ? (
        <span className="driver-tag">{t('driverTrip.row.free', { count: trip.seatsLeft })}</span>
      ) : (
        <span className="driver-tag driver-tag-full">{t('driverTrip.row.full')}</span>
      )}
    </DriverTripRow>
  );
}
