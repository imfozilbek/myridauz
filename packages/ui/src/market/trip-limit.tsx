import { tripHolds } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { StateScreen } from '../states/state-screen';
import { MainButton } from '../telegram/bottom-button';

// One live trip of a driver (owner decision 12.10.2026, docs/172): known before the first step, so
// it is said at once, not after the whole trip is filled (G52, docs/112). While loading or on a
// failure the flow opens: the server checks again.
// The number of the live trips once there is one, else null.
export function useTripLimitReached(): number | null {
  const { market } = useApiClients();
  const [reached, setReached] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    market.myTrips().then(
      (trips) => {
        const now = Date.now();
        const held = trips.filter((trip) => tripHolds(trip, now)).length;
        if (live) setReached(held > 0 ? held : null);
      },
      () => undefined,
    );
    return () => void (live = false);
  }, [market]);
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
