import type { Booking } from '@platform/contracts';
import { useEffect, useRef, useState } from 'react';
import { Cell, List, SegmentedControl, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { IconTile } from '../icon-tile';
import { useMapView } from '../map/use-map-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { requestPosition } from '../telegram/location';
import { useScreenBackground } from '../telegram/screen-background';
import { stopsInOrder, withMoved, type StopKind } from './driver-stops';
import { StopList } from './stop-list';
import { useNavigator } from './use-navigator';
import '../way/way.css';

const KINDS: readonly StopKind[] = ['pickups', 'dropoffs'];

// «Safar xaritasi» of the driver (G24, docs/70): the confirmed passengers on the map, the pickups
// and the dropoffs in the order of the way, and «Yoʻl koʻrsatish» in the chosen navigator.
export function DriverTripMap({ bookings, onBack }: { bookings: readonly Booking[]; onBack: () => void }) {
  useScreenView('bookings.trip_map');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { map } = useApiClients();
  const { colors } = useBrand().theme;
  const [kind, setKind] = useState<StopKind>('pickups');
  const [stops, setStops] = useState(() => stopsInOrder(bookings, null));
  const byHand = useRef(false);
  const shown = stops[kind];
  const { box, view } = useMapView(map, shown[0]?.point ?? stops.dropoffs[0]?.point ?? { lat: 0, lng: 0 });
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
  if (navigator.asking)
    return (
      <ChoiceStep
        screen="bookings.navigator"
        icon="navigate"
        title={t('way.map.navigator')}
        choices={navigator.navigators.map((id) => ({ value: id, label: t(`way.navigator.${id}`) }))}
        onBack={navigator.cancel}
        onDone={(chosen) => navigator.pick(chosen, navigator.asking)}
      />
    );
  const move = (index: number, by: -1 | 1) => {
    byHand.current = true;
    setStops((now) => ({ ...now, [kind]: withMoved(now[kind], index, by) }));
  };
  return (
    <div className="trip-map">
      <BackButton onClick={onBack} />
      <div ref={box} className="trip-map-box" data-state={view ? 'ready' : 'loading'} />
      <List>
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
      {shown.length > 0 ? (
        <MainButton text={t('way.map.go')} onClick={() => navigator.go(shown.map((stop) => stop.point))} />
      ) : null}
    </div>
  );
}
