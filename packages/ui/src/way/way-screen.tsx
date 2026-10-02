import { insideUzbekistan, type Pitak, type PickupMode, type Point } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { Button } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from '../places/directory';
import { RouteScreen } from '../places/route-screen';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { requestPosition } from '../telegram/location';
import { PointScreen } from './point-screen';
import { WayCard } from './way-card';
import { WayMap } from './way-map';
import { centerOf, regionOf, type Way, type WayEnd } from './way-end';
import './way.css';

type Props = {
  readonly onBack: () => void;
  readonly onDone: (way: Way) => void;
  // Back from the next step, both points and the way chosen before (docs/94 F8).
  readonly initial?: Way;
};

type WayFormProps = Props & { readonly directory: PlaceDirectory };

// «Qayerdan / Qayerga» (G24, docs/71): the start and the end of a request of a passenger over the
// map. The search of trips uses lists (G26, docs/74). Without the directory no place has a name.
export function WayScreen(props: Props) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={props.onBack} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={props.onBack} />;
  return <WayForm {...props} directory={state.directory} />;
}

function WayForm({ onBack, onDone, directory, initial }: WayFormProps) {
  useScreenView('way.screen');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { map } = useApiClients();
  const [from, setFrom] = useState<WayEnd | null>(initial?.from ?? null);
  const [to, setTo] = useState<WayEnd | null>(initial?.to ?? null);
  const [here, setHere] = useState(false);
  const [mode, setMode] = useState<PickupMode>(initial?.mode ?? 'both');
  const [known] = useState(initial !== undefined);
  const [pitak, setPitak] = useState<Pitak | null | undefined>(undefined);
  const [editing, setEditing] = useState<'from' | 'to' | 'list' | null>(null);
  const [note, setNote] = useState<TranslationKey | null>(null);
  useEffect(() => {
    // Back from the next step, the start is the one chosen before.
    if (known) return undefined;
    let active = true;
    // The start fills itself where the person stands, when Telegram lets us know (docs/71).
    void requestPosition().then(async (point: Point | null) => {
      if (!point || !insideUzbekistan(point)) return;
      const where = await map.where(point).catch(() => null);
      const place = where?.district ? directory.find(where.district) : undefined;
      if (!active || !place || !where) return;
      setFrom((known) => known ?? { place, point, name: where.name });
      setHere(true);
      track({ name: 'place_point_saved', screen: 'way.screen', method: 'auto' });
    });
    return () => void (active = false);
  }, [map, directory, track, known]);
  const fromRegion = from ? regionOf(from) : null;
  const toRegion = to ? regionOf(to) : null;
  useEffect(() => {
    setPitak(undefined);
    if (!fromRegion || !toRegion) return;
    // A pitak joins two regions: inside one region there is none (docs/72).
    if (fromRegion === toRegion) return setPitak(null);
    map.pitakOf(fromRegion, toRegion).then(setPitak, () => setPitak(null));
  }, [map, fromRegion, toRegion]);
  // Without a pitak only the door is left (docs/70).
  useEffect(() => void (pitak === null && mode !== 'door' && setMode('door')), [pitak, mode]);
  const picked = (end: 'from' | 'to') => (chosen: WayEnd) => {
    if (end === 'from') setHere(false);
    (end === 'from' ? setFrom : setTo)(chosen);
    setNote(null);
    setEditing(null);
  };
  if (editing === 'from' || editing === 'to') {
    const known = (editing === 'from' ? from : to) ?? from ?? to;
    const start = known?.point ?? { lat: 41.3111, lng: 69.2797 };
    return (
      <PointScreen
        title={editing === 'from' ? 'way.point.from' : 'way.point.to'}
        start={start}
        find={directory.find}
        onBack={() => setEditing(null)}
        onPick={picked(editing)}
      />
    );
  }
  if (editing === 'list')
    return (
      <RouteScreen
        allowWholeRegion={false}
        onBack={() => setEditing(null)}
        onDone={(route) => {
          setFrom(centerOf(route.from));
          setTo(centerOf(route.to));
          setEditing(null);
        }}
      />
    );
  const submit = () => {
    if (!from || !to) return (haptic.error(), setNote(from ? 'way.needTo' : 'way.needFrom'));
    return onDone({ from, to, mode });
  };
  // The funnel «way» is the search by lists now (G26): a request does not count in it.
  const changeMode = (next: PickupMode) => setMode(next);
  return (
    <div className="pickup-map">
      <Screen onBack={onBack} />
      <WayMap from={from} to={to} pitak={mode === 'door' ? null : (pitak ?? null)} />
      {/* The card and the other way by the list: at the top, the bottom is for the main button. */}
      <div className="way-top">
        <WayCard
          from={from}
          to={to}
          mode={mode}
          pitak={pitak}
          here={here}
          onPick={setEditing}
          onMode={changeMode}
        />
        <div className="way-list">
          <Button mode="white" size="s" onClick={() => setEditing('list')}>
            {t('way.list')}
          </Button>
        </div>
      </div>
      {note ? (
        <Text className="way-pin-name" role="alert">
          {t(note)}
        </Text>
      ) : null}
      <MainButton text={t('common.continue')} onClick={submit} />
    </div>
  );
}
