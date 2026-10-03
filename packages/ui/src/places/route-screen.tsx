import './places.css';
import { checkRoute, type Location, type RouteError } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useCallback, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import type { PlaceDirectory } from './directory';
import { PlacePicker } from './place-picker';
import { useHere } from './use-here';
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
  // Each end chosen, for the funnel of the search (G26).
  readonly onEnd?: (end: 'from' | 'to') => void;
  // The search (G35, docs/97 K1): the missing end opens by itself, both ends go on at once.
  readonly quick?: boolean;
};

// "From" and "to" of a trip or a search. A trip inside one city is refused right away (docs/14).
export function RouteScreen(props: RouteScreenProps) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={props.onBack} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={props.onBack} />;
  return <RouteForm {...props} directory={state.directory} />;
}

function RouteForm({
  directory,
  allowWholeRegion,
  onBack,
  onDone,
  pick,
  initial,
  onEnd,
  quick,
}: RouteScreenProps & { directory: PlaceDirectory }) {
  const { t } = useI18n();
  // «Qayerdan» fills itself where the person stands, when they allowed it before (G26, docs/74).
  const here = useHere(directory);
  const [chosenFrom, setFrom] = useState<Location | null>(initial?.from ?? null);
  const from = chosenFrom ?? here;
  const [to, setTo] = useState<Location | null>(initial?.to ?? null);
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
  const submit = useCallback(() => {
    if (!from || !to || error) return haptic.error();
    onDone({ from, to });
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

type RouteViewProps = {
  readonly from: Location | null;
  readonly to: Location | null;
  readonly error: RouteError | null;
  readonly onPick: (end: 'from' | 'to') => void;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
};

function RouteView({ from, to, error, onPick, onBack, onSubmit }: RouteViewProps) {
  useScreenView('places.route');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const value = (place: Location | null) => <CellValue>{place ? place.name : t('places.choose')}</CellValue>;
  return (
    <div className="places">
      <Screen onBack={onBack} />
      <Title weight="1" className="places-title">
        {t('places.route')}
      </Title>
      <List>
        <Section>
          <Cell before={<IconTile name="origin" />} after={value(from)} onClick={() => onPick('from')}>
            {t('places.from')}
          </Cell>
          <Cell
            before={<IconTile name="destination" tone="accent" />}
            after={value(to)}
            onClick={() => onPick('to')}
          >
            {t('places.to')}
          </Cell>
        </Section>
      </List>
      {error ? <Text className="places-error">{t(`errors.${error}`)}</Text> : null}
      <MainButton text={t('common.continue')} onClick={onSubmit} />
    </div>
  );
}
