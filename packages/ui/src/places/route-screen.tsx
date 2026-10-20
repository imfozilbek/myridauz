import { checkRoute, type Location, type RouteError } from '@platform/contracts';
import { useCallback, useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { haptic } from '../telegram/feedback';
import type { PlaceDirectory } from './directory';
import { PlacePicker } from './place-picker';
import { RouteView } from './route-form-view';
import { useHereAsked } from './use-here';
import { useOpenAtTop } from '../telegram/screen-top';
import { useDirectory } from './use-directory';

export type Route = { readonly from: Location; readonly to: Location };

type RouteScreenProps = {
  readonly allowWholeRegion: boolean;
  readonly onBack: () => void;
  readonly onDone: (route: Route) => void;
  // From the main screen: the list of one end opens at once (G25).
  readonly pick?: 'from' | 'to';
  // Back from the next step, the route chosen before (docs/90 F-P2).
  readonly initial?: Route;
  // One end of the block at the bottom of the main screen, the other still open (G76; G79 П20).
  readonly from?: Location;
  readonly to?: Location;
  // Each end chosen, for the funnel of the search (G26).
  readonly onEnd?: (end: 'from' | 'to') => void;
  // The search (G35, docs/97 K1): the first missing end opens at once (G79 В8), the next by itself,
  // both ends go on at once.
  readonly quick?: boolean;
};

// "From" and "to" of a trip or a search. A trip inside one city is refused right away (docs/14).
export function RouteScreen(props: RouteScreenProps) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={props.onBack} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={props.onBack} />;
  return <RouteStart {...props} directory={state.directory} />;
}

type Known = RouteScreenProps & { readonly directory: PlaceDirectory };

// The first empty end opens at once (G79 В8): with no end known, the place of the person is waited
// for a moment, so «Qayerga» opens where «Qayerdan» is where the person stands.
function RouteStart(props: Known) {
  const { live, settled } = useHereAsked(props.directory);
  const auto = props.quick === true && !props.pick && !props.initial && !props.from && !props.to;
  if (auto && settled === undefined) return <ScreenSkeleton onBack={props.onBack} />;
  const first = settled ? 'to' : 'from';
  return <RouteForm {...props} here={live} {...(auto ? { pick: first } : {})} />;
}

function RouteForm({
  directory,
  allowWholeRegion,
  onBack,
  onDone,
  pick,
  initial,
  from: known,
  to: knownTo,
  onEnd,
  quick,
  here,
}: Known & { readonly here: Location | null }) {
  const { t } = useI18n();
  // «Qayerdan» fills itself where the person stands, when they allowed it before (G26, docs/74).
  const [chosenFrom, setFrom] = useState<Location | null>(initial?.from ?? known ?? null);
  const from = chosenFrom ?? here;
  const [to, setTo] = useState<Location | null>(initial?.to ?? knownTo ?? null);
  const [picking, setPicking] = useState<'from' | 'to' | null>(pick ?? null);
  // Back from a long list, the form shows «Qayerdan» again (docs/83 N22).
  useOpenAtTop(picking);
  const [error, setError] = useState<RouteError | null>(null);
  const choose = useCallback(
    (place: Location) => {
      const next = { from: picking === 'from' ? place : from, to: picking === 'to' ? place : to };
      setFrom(next.from);
      setTo(next.to);
      if (picking) onEnd?.(picking);
      const found = next.from && next.to ? checkRoute(next.from, next.to, directory.find) : null;
      setError(found);
      if (found) haptic.error();
      const missing = !next.to ? 'to' : !next.from ? 'from' : null;
      setPicking(quick && !found ? missing : null);
      if (quick && !found && next.from && next.to) onDone({ from: next.from, to: next.to });
    },
    [picking, from, to, directory, onEnd, quick, onDone],
  );
  // «Davom etish» with an end missing or refused opens that end: a tap always leads on (G91 robot).
  const submit = useCallback(() => {
    if (from && to && !error) return onDone({ from, to });
    haptic.error();
    setPicking(!from ? 'from' : 'to');
  }, [from, to, error, onDone]);
  if (picking) {
    return (
      <PlacePicker
        key={picking}
        title={t(picking === 'from' ? 'places.fromTitle' : 'places.toTitle')}
        directory={directory}
        allowWholeRegion={allowWholeRegion}
        onPick={choose}
        onBack={() => setPicking(null)}
      />
    );
  }
  return (
    <RouteView from={from} to={to} error={error} onPick={setPicking} onBack={onBack} onSubmit={submit} />
  );
}
