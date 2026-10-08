import type { Trip } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { RouteLine } from '../find/route-line';
import type { TripDraft } from '../market/trip-draft';
import { useDayLabel } from '../market/when';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { useReturnPlan } from './use-return-plan';
import { useReturnRequests } from './use-return-requests';
import '../find/safar.css';
import '../find/route-line.css';
import './trip-end.css';
import './return-offer.css';

type Props = {
  readonly trip: Trip;
  // The publishing with the way back filled in (G18 returnDraft); the lead reconciles it with G63 C1.
  readonly onPublish: (draft: Partial<TripDraft>) => void;
  readonly onClose: () => void;
};

// «Qaytish» after the review (owner decision 06.10.2026, docs/124 В, mockup g63/4 screen 16): the
// way back tomorrow at the time after the arrival and the rest, with the requests already waiting.
export function ReturnOffer({ trip, onPublish, onClose }: Props) {
  useScreenView('trip_end.return');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const dayLabel = useDayLabel();
  const { now, day, departAt, draft } = useReturnPlan(trip);
  const requests = useReturnRequests(trip, day);
  return (
    <div className="trip-end trip-back" style={brandVars(colors)}>
      <Screen onBack={onClose} />
      <h1 className="trip-back-title">{t('driverAfter.back.title')}</h1>
      <p className="trip-back-day">{dayLabel(day, now)}</p>
      <RouteLine from={trip.to} to={trip.from} departAt={departAt} km={trip.km} icon="carSide" />
      {requests.count > 0 ? (
        <p className="trip-end-card trip-back-requests">
          <b>
            {t('driverAfter.back.requests', {
              from: requests.from,
              to: requests.to,
              count: String(requests.count),
            })}
          </b>
          <span>{t('driverAfter.back.ready')}</span>
        </p>
      ) : null}
      {draft ? <MainButton text={t('driverAfter.back.publish')} onClick={() => onPublish(draft)} /> : null}
    </div>
  );
}
