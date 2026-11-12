import { checkRoute, type Location, type RouteError } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { REQUEST_DIRECTIONS } from '../find/direction-kinds';
import { DirectionsScreen } from '../find/directions-screen';
import type { PlaceDirectory } from '../places/directory';
import { PlacePicker } from '../places/place-picker';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { haptic } from '../telegram/feedback';
import { useDriverEnds } from './dock/driver-launch';
import { useHomeRoute } from './home-route';

type Props = { readonly onBack: () => void };

// «Qayerga» of a driver (owner decision 12.11.2026, docs/118): the screen of the passenger with the
// requests of passengers by region, from «Qayerdan» of the block; unknown, it is asked first.
export function DriverPickTo({ onBack }: Props) {
  const [places, retry] = useDirectory();
  const directory = places.status === 'ready' ? places.directory : null;
  const { from } = useDriverEnds(directory).ends;
  if (places.status === 'loading') return <ScreenSkeleton onBack={onBack} />;
  if (places.status === 'error') return <ErrorScreen onRetry={retry} onBack={onBack} />;
  return <PickToForm directory={places.directory} known={from} onBack={onBack} />;
}

type FormProps = Props & { readonly directory: PlaceDirectory; readonly known: Location | null };

// A trip goes to a district or a city (docs/14): a region opens its places, the search picks at once.
function PickToForm({ directory, known, onBack }: FormProps) {
  const { t } = useI18n();
  const { choose } = useHomeRoute();
  const [from, setFrom] = useState<Location | null>(known);
  const [picking, setPicking] = useState(known === null);
  const [region, setRegion] = useState<Location | null>(null);
  const [error, setError] = useState<RouteError | null>(null);
  const done = (start: Location, to: Location) => {
    const found = checkRoute(start, to, directory.find);
    setError(found);
    setRegion(null);
    if (found) return haptic.error();
    choose(start.id === known?.id ? { to } : { from: start, to });
    onBack();
  };
  if (picking || !from)
    return (
      <PlacePicker
        title={t('places.fromTitle')}
        directory={directory}
        allowWholeRegion
        onPick={(place) => {
          setFrom(place);
          setPicking(false);
        }}
        onBack={from ? () => setPicking(false) : onBack}
      />
    );
  if (region)
    return (
      <PlacePicker
        title={t('home.dock.toDriver')}
        directory={directory}
        allowWholeRegion
        region={region}
        onPick={(to) => done(from, to)}
        onBack={() => setRegion(null)}
      />
    );
  return (
    <DirectionsScreen
      key={from.id}
      kind={REQUEST_DIRECTIONS}
      directory={directory}
      from={from}
      error={error}
      onBack={onBack}
      onChangeFrom={() => setPicking(true)}
      onPick={(to) => (to.parentId === null ? setRegion(to) : done(from, to))}
    />
  );
}
