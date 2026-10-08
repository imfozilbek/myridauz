import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useEnds } from '../requests/ends';
import './driver-trips.css';

const PLUS = 18;
const CHEVRON = 10;

// «Ertaga shu safar» (G64, mockup g64/6): the last trip the driver made, tomorrow at its time, on
// the one screen of the publishing with every answer filled (G63).
export function AgainCard({ trip, onOpen }: { readonly trip: Trip; readonly onOpen: () => void }) {
  const { t, formatTime } = useI18n();
  const ends = useEnds()(trip);
  return (
    <button type="button" className="driver-again" onClick={onOpen}>
      <span className="driver-again-plus">
        <Icon name="more" size={PLUS} />
      </span>
      <span className="driver-again-text">
        <b>{t('driverTrip.again.title')}</b>
        <span>
          {t('driverTrip.again.sub', {
            route: t('requests.card.route', ends),
            time: formatTime(new Date(trip.departAt)),
          })}
        </span>
      </span>
      <Icon name="next" size={CHEVRON} />
    </button>
  );
}
