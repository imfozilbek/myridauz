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
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import type { PlaceDirectory } from './directory';
import { PlacePicker } from './place-picker';
import { useDirectory } from './use-directory';

export type Route = { readonly from: Location; readonly to: Location };

type RouteScreenProps = {
  readonly allowWholeRegion: boolean;
  readonly onBack: () => void;
  readonly onDone: (route: Route) => void;
};

// "From" and "to" of a trip or a search. A trip inside one city is refused right away (docs/14).
export function RouteScreen(props: RouteScreenProps) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} />;
  return <RouteForm {...props} directory={state.directory} />;
}

function RouteForm({
  directory,
  allowWholeRegion,
  onBack,
  onDone,
}: RouteScreenProps & { directory: PlaceDirectory }) {
  const { t } = useI18n();
  const [from, setFrom] = useState<Location | null>(null);
  const [to, setTo] = useState<Location | null>(null);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [error, setError] = useState<RouteError | null>(null);
  const choose = useCallback(
    (place: Location) => {
      const next = { from: picking === 'from' ? place : from, to: picking === 'to' ? place : to };
      setFrom(next.from);
      setTo(next.to);
      setPicking(null);
      const found = next.from && next.to ? checkRoute(next.from, next.to, directory.find) : null;
      setError(found);
      if (found) haptic.error();
    },
    [picking, from, to, directory],
  );
  const submit = useCallback(() => {
    if (!from || !to || error) return haptic.error();
    onDone({ from, to });
  }, [from, to, error, onDone]);
  if (picking) {
    return (
      <PlacePicker
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
      <BackButton onClick={onBack} />
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
