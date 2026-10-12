import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { RouteLine } from '../find/route-line';
import { useDayLabel } from '../market/when';
import type { ReturnPlan } from './use-return-plan';
import { useReturnRequests } from './use-return-requests';
import '../find/safar.css';
import '../find/route-line.css';
import './return-card.css';

type Props = { readonly trip: Trip; readonly plan: ReturnPlan };

// The way back under the stars of «Safar tugadi» (G78 В10 A, docs/124 В): the day, the way after the
// arrival and the rest, the requests waiting; «Qaytish safari» beside «Yuborish» publishes it.
export function ReturnCard({ trip, plan }: Props) {
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const requests = useReturnRequests(trip, plan.day);
  return (
    <>
      <p className="trip-back-day">
        {t('driverAfter.back.when', {
          question: t('driverAfter.back.title'),
          day: dayLabel(plan.day, plan.now),
        })}
      </p>
      <RouteLine from={trip.to} to={trip.from} departAt={plan.departAt} km={trip.km} icon="carSide" />
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
    </>
  );
}
