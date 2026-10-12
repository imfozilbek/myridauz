import { checkRoute, type Location, type RouteError } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from '../places/directory';
import { PlacePicker } from '../places/place-picker';
import type { Route } from '../places/route-screen';
import { useDirectory } from '../places/use-directory';
import { useHereAsked } from '../places/use-here';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { haptic } from '../telegram/feedback';
import { DirectionsScreen } from './directions-screen';

type Props = {
  readonly onBack: () => void;
  readonly onDone: (route: Route) => void;
  // Back from the trips: the same «Qayerdan»; from the main screen: «Qayerdan» opens at once.
  readonly from?: Location;
  readonly pick?: 'from' | 'to';
  // Only «Qayerga» of the block (G79 П20): its trips right after «Qayerdan».
  readonly to?: Location;
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
  to,
}: Props & { directory: PlaceDirectory }) {
  const { t } = useI18n();
  const here = useHereAsked(directory).settled;
  const [chosen, setChosen] = useState<Location | null>(known ?? null);
  const from = chosen ?? here;
  const [picking, setPicking] = useState(pick === 'from');
  const [error, setError] = useState<RouteError | null>(null);
  // The phone still tells where the person stands: a short wait, then the list of «Qayerdan» stays
  // open, it never changes by itself under the finger (G59).
  const waiting = from === undefined && !picking;
  const choose = (start: Location, end: Location) => {
    const found = checkRoute(start, end, directory.find);
    setError(found);
    if (found) return haptic.error();
    onDone({ from: start, to: end });
  };
  if (waiting) return <ScreenSkeleton onBack={onBack} />;
  if (picking || !from)
    return (
      <PlacePicker
        title={t('places.fromTitle')}
        directory={directory}
        allowWholeRegion
        cityAtOnce
        onPick={(place) => {
          setChosen(place);
          setPicking(false);
          if (to) choose(place, to);
        }}
        onBack={from ? () => setPicking(false) : onBack}
      />
    );
  return (
    <DirectionsScreen
      key={from.id}
      directory={directory}
      from={from}
      error={error}
      onBack={onBack}
      onChangeFrom={() => setPicking(true)}
      onPick={(end) => choose(from, end)}
    />
  );
}
