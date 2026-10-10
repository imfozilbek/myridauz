import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { StateScreen } from '../states/state-screen';
import { MainButton } from '../telegram/bottom-button';

// Whether the driver already has as many active trips as the brand allows (docs/103): known before
// the first step, so the limit is said at once, not after the whole trip is filled (G52, docs/112).
// While loading or on a failure the flow opens: the server checks the limit again.
// The number of the active trips once it is the limit, else null.
export function useTripLimitReached(): number | null {
  const { market } = useApiClients();
  const { maxActiveTrips } = useBrand().schedule;
  const [reached, setReached] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    market.myTrips().then(
      (trips) => {
        const active = trips.filter((trip) => trip.status === 'active' || trip.status === 'full');
        if (live) setReached(active.length >= maxActiveTrips ? active.length : null);
      },
      () => undefined,
    );
    return () => void (live = false);
  }, [market, maxActiveTrips]);
  return reached;
}

type LimitProps = { readonly count: number; readonly onBack: () => void; readonly onMyTrips: () => void };

// «Faol safarlar 3 ta» (G75, mockup g75/1 A phone 3): what to do, and the trips to cancel or end.
export function TripLimitScreen({ count, onBack, onMyTrips }: LimitProps) {
  const { t } = useI18n();
  return (
    <>
      <Screen onBack={onBack} />
      <StateScreen
        icon="newTrip"
        title={t('market.limit.title', { count: String(count) })}
        description={t('market.limit.hint')}
        button={<MainButton text={t('common.myTrips')} onClick={onMyTrips} />}
      />
    </>
  );
}
