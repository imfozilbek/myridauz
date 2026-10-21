import { tashkentDate, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useTripTime } from '../trip/trip-time';
import { useEnds } from './ends';
import { useRequestDay } from './request-day';

// «Safaringiz: ertaga 08:00, Samarqand · 3 boʻsh joy · 90 000» (mockup g64/2): the live trip the
// requests below are measured against; a tap opens it.
export function BoardTrip({ trip, onOpen }: { readonly trip: Trip; readonly onOpen: () => void }) {
  const { t, formatNumber } = useI18n();
  const tripTime = useTripTime();
  const day = useRequestDay();
  const { to } = useEnds()(trip);
  return (
    <button type="button" className="board-trip" onClick={onOpen}>
      <b>
        {t('requests.board.trip', {
          day: day(tashkentDate(trip.departAt)),
          time: tripTime(trip),
          to,
        })}
      </b>
      <span>
        {t('requests.board.tripSub', { seats: String(trip.seatsLeft), price: formatNumber(trip.price) })}
      </span>
    </button>
  );
}
