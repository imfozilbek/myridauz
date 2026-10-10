import { SafarScreen } from '../find/safar-screen';
import { useApiClients } from '../context/api-clients';
import { PlacesGate } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

type Props = { readonly id: string; readonly onDone: () => void };

// A new person from a channel post sees the trip first (G75, docs/124 Д): «Band qilish», back and
// «Boshqa safarlar» lead to the registration; after it the link opens the same trip again.
export function TripPreview({ id, onDone }: Props) {
  return (
    <PlacesGate onBack={onDone}>
      <PreviewTrip id={id} onDone={onDone} />
    </PlacesGate>
  );
}

function PreviewTrip({ id, onDone }: Props) {
  const { market } = useApiClients();
  const { value, failed } = useLoad(() => market.trip(id));
  // A trip that does not open is no reason to wait: the registration goes on.
  if (failed) return <ErrorScreen onRetry={onDone} onBack={onDone} />;
  if (!value) return <ScreenSkeleton onBack={onDone} />;
  return <SafarScreen trip={value} onBack={onDone} onBook={onDone} onOthers={onDone} />;
}
