import { checkRoute, type Location, type RouteError } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from '../places/directory';
import { PlacePicker } from '../places/place-picker';
import type { Route } from '../places/route-screen';
import { useDirectory } from '../places/use-directory';
import { useHereChecked } from '../places/use-here';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { haptic } from '../telegram/feedback';
import { DirectionsScreen } from './directions-screen';

const HERE_WAIT_MS = 1500;

type Props = {
  readonly onBack: () => void;
  readonly onDone: (route: Route) => void;
  // Back from the trips: the same «Qayerdan»; from the main screen: «Qayerdan» opens at once.
  readonly from?: Location;
  readonly pick?: 'from' | 'to';
};

// The start of the search (G59, docs/118 path 2): «Qayerdan» is where the person stands or chose,
// then «Qayerga borasiz?». Without a known «Qayerdan» its list opens first.
export function FindStart(props: Props) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={props.onBack} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={props.onBack} />;
  return <FindStartForm {...props} directory={state.directory} />;
}

function FindStartForm({
  directory,
  onBack,
  onDone,
  from: known,
  pick,
}: Props & { directory: PlaceDirectory }) {
  const { t } = useI18n();
  const here = useHereChecked(directory);
  const [chosen, setChosen] = useState<Location | null>(known ?? null);
  const from = chosen ?? here;
  const [picking, setPicking] = useState(pick === 'from');
  const [error, setError] = useState<RouteError | null>(null);
  // The phone still tells where the person stands: a short wait, then the list of «Qayerdan» stays
  // open, it never changes by itself under the finger (G59).
  const waiting = from === undefined && !picking;
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setTimeout(() => setPicking(true), HERE_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waiting]);
  if (waiting) return <ScreenSkeleton onBack={onBack} />;
  if (picking || !from)
    return (
      <PlacePicker
        title={t('places.fromTitle')}
        directory={directory}
        allowWholeRegion
        onPick={(place) => {
          setChosen(place);
          setPicking(false);
        }}
        onBack={from ? () => setPicking(false) : onBack}
      />
    );
  const choose = (to: Location) => {
    const found = checkRoute(from, to, directory.find);
    setError(found);
    if (found) return haptic.error();
    onDone({ from, to });
  };
  return (
    <DirectionsScreen
      key={from.id}
      directory={directory}
      from={from}
      error={error}
      onBack={onBack}
      onChangeFrom={() => setPicking(true)}
      onPick={choose}
    />
  );
}
