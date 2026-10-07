import { arrivalAt, type SharedTrip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';

const STEPS = ['boarded', 'on_the_way', 'arrived'] as const;
// How far the trip went: no step before the car, all three once arrived.
const DONE = { waiting: 0, boarded: 1, on_the_way: 2, arrived: 3, completed: 3, cancelled: 0 } as const;

// The top of the screen of the close people (owner decision 06.10.2026, mockup g60/3): big, where
// the person is and when they arrive, then three steps of the way.
export function FollowState({ trip }: { readonly trip: SharedTrip }) {
  const { t, formatDate, formatTime } = useI18n();
  const directory = usePlaces();
  const name = trip.passengerName;
  const done = DONE[trip.status];
  const going = trip.status !== 'cancelled';
  // Before the arrival: when they will be there; a moved trip says so (docs/124 И).
  const coming = done < DONE.arrived;
  const moved = trip.status === 'waiting' && trip.firstDepartAt !== trip.departAt;
  return (
    <div className={going ? 'follow-state' : 'follow-state follow-state-off'}>
      <span className="follow-state-title">
        {t('share.follow.title', { name })} · {formatDate(new Date(trip.departAt))}
      </span>
      <b className="follow-state-big">{t(`share.follow.big.${trip.status}`, { name })}</b>
      {going ? (
        <>
          {moved ? (
            <span className="follow-state-eta">
              {t('share.follow.moved', {
                from: formatTime(new Date(trip.firstDepartAt)),
                to: formatTime(new Date(trip.departAt)),
              })}
            </span>
          ) : null}
          {coming ? (
            <span className="follow-state-eta">
              {t('share.follow.eta', {
                place: directory.find(trip.to)?.name ?? '',
                time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
              })}
            </span>
          ) : (
            <span className="follow-state-eta">
              {t('share.follow.arrivedAt', {
                place: directory.find(trip.to)?.name ?? '',
                time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
              })}
            </span>
          )}
          <ol className="follow-steps" aria-label={t('share.follow.status')}>
            {STEPS.map((step, index) => (
              <li key={step} data-done={String(index < done)}>
                {t(`share.follow.status.${step}`)}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}
