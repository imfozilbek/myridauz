import type { Booking } from '@platform/contracts';
import { useEffect, useRef, useState } from 'react';
import { Cell, List, SegmentedControl, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { MapRetry } from '../map/map-retry';
import { useMapView } from '../map/use-map-view';
import { useDraft } from '../screen/draft';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { requestPosition } from '../telegram/location';
import { useScreenBackground } from '../telegram/screen-background';
import { handOrderOf, inHandOrder, stopsInOrder, withMoved, type StopKind } from './driver-stops';
import { StopList } from './stop-list';
import { NavigatorSheet } from './navigator-sheet';
import { useNavigator } from './use-navigator';
import '../way/way.css';

const KINDS: readonly StopKind[] = ['pickups', 'dropoffs'];

// «Safar xaritasi» of the driver (G24, docs/70): the confirmed passengers on the map, the pickups
// and the dropoffs in the order of the way, and «Yoʻl koʻrsatish» in the chosen navigator.
export function DriverTripMap({ bookings, onBack }: { bookings: readonly Booking[]; onBack: () => void }) {
  useScreenView('bookings.trip_map');
  useScreenBackground();
  const { t } = useI18n();
  const { map } = useApiClients();
  const { colors } = useBrand().theme;
  const [kind, setKind] = useState<StopKind>('pickups');
  // An order set by hand comes back after the system unloaded the app in a navigator (docs/94 C7).
  const handOrder = useDraft(`stops:${bookings[0]?.trip.id ?? ''}`, handOrderOf);
  const [stops, setStops] = useState(() => {
    const order = stopsInOrder(bookings, null);
    return handOrder.restored ? inHandOrder(order, handOrder.restored) : order;
  });
  const byHand = useRef(handOrder.restored !== null);
  const { save } = handOrder;
  useEffect(() => {
    if (byHand.current)
      save({ pickups: stops.pickups.map(({ id }) => id), dropoffs: stops.dropoffs.map(({ id }) => id) });
  }, [stops, save]);
  const shown = stops[kind];
  const start = shown[0]?.point ?? stops.dropoffs[0]?.point ?? { lat: 0, lng: 0 };
  const { box, view, failed, retry } = useMapView(map, start, true);
  const navigator = useNavigator();
  // Where the driver stands orders the pickups, until the driver changes the order by hand.
  useEffect(() => {
    void requestPosition().then((here) => {
      if (here && !byHand.current) setStops(stopsInOrder(bookings, here));
    });
    // Asked once, when the screen opens.
  }, []);
  useEffect(() => {
    if (!view) return;
    const color = kind === 'pickups' ? colors.brandStrong : colors.accent;
    const marks = shown.map((stop, index) => ({ point: stop.point, color, label: String(index + 1) }));
    const points = shown.map((stop) => stop.point);
    view.show(marks, points.length > 1 ? points : null);
    view.fit(points);
  }, [view, shown, kind, colors]);
  const move = (index: number, by: -1 | 1) => {
    byHand.current = true;
    setStops((now) => ({ ...now, [kind]: withMoved(now[kind], index, by) }));
  };
  return (
    <div className="trip-map">
      {/* The open sheet of navigators takes «Назад» and the main button first (docs/94 C6). */}
      <Screen onBack={navigator.asking ? navigator.cancel : onBack} />
      <div ref={box} className="trip-map-box" hidden={failed} data-state={view ? 'ready' : 'loading'} />
      <List>
        {failed ? <MapRetry onRetry={retry} /> : null}
        <div className="trip-map-tabs">
          <SegmentedControl>
            {KINDS.map((each) => (
              <SegmentedControl.Item key={each} selected={each === kind} onClick={() => setKind(each)}>
                {t(`way.map.${each}`)}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>
        </div>
        <StopList stops={shown} onMove={move} />
        {navigator.navigator ? (
          <Section>
            <Cell before={<IconTile name="navigate" />} onClick={navigator.change}>
              {t('way.map.navigatorChange')}
            </Cell>
          </Section>
        ) : null}
      </List>
      <NavigatorSheet navigator={navigator} />
      {shown.length > 0 && !navigator.asking ? (
        <MainButton text={t('way.map.go')} onClick={() => navigator.go(shown.map((stop) => stop.point))} />
      ) : null}
    </div>
  );
}
