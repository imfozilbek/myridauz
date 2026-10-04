import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';

// Whether the driver already has as many active trips as the brand allows (docs/103): known before
// the first step, so the limit is said at once, not after the whole trip is filled (G52, docs/112).
// While loading or on a failure the flow opens: the server checks the limit again.
export function useTripLimitReached(): boolean {
  const { market } = useApiClients();
  const { maxActiveTrips } = useBrand().schedule;
  const [reached, setReached] = useState(false);
  useEffect(() => {
    let live = true;
    market.myTrips().then(
      (trips) => {
        const active = trips.filter((trip) => trip.status === 'active' || trip.status === 'full');
        if (live) setReached(active.length >= maxActiveTrips);
      },
      () => undefined,
    );
    return () => void (live = false);
  }, [market, maxActiveTrips]);
  return reached;
}

export function TripLimitScreen({ onBack }: { readonly onBack: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <Screen onBack={onBack} />
      <EmptyState icon="myTrips" title={t('errors.trips.too_many')} />
    </>
  );
}
