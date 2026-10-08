import { tashkentDate, type Booking, type Trip } from '@platform/contracts';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MapRetry } from '../map/map-retry';
import { useMapView } from '../map/use-map-view';
import { useShortDay } from '../market/when';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { requestPosition } from '../telegram/location';
import { useScreenBackground } from '../telegram/screen-background';
import { MEETING_PIN } from '../trip/meeting-map';
import { stopsInOrder, type Stop } from './driver-stops';
import { NavigatorSheet } from './navigator-sheet';
import { StopCard } from './stop-card';
import { useNavigator } from './use-navigator';
import '../way/way.css';

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly now: number;
  // A pickup point opens its meeting (screen 13); null while the meeting is not open.
  readonly onPoint: ((stop: Stop) => void) | null;
  readonly onBack: () => void;
};

// «Safar xaritasi» of the driver (mockup g63/4 screen 12, docs/126): the map with a pin on every
// point, the day and the passengers, the points in the order of the way from where the driver
// stands, and «Yoʻl koʻrsatish» in the chosen navigator. Before the departure the pickups, on the
// way the dropoffs.
export function DriverTripMap({ trip, bookings, now, onPoint, onBack }: Props) {
  useScreenView('bookings.trip_map');
  useScreenBackground();
  const { t, formatTime } = useI18n();
  const shortDay = useShortDay();
  const { map } = useApiClients();
  const { bg, brandStrong } = useBrand().theme.colors;
  const kind = trip.departedAt === null ? 'pickups' : 'dropoffs';
  const [stops, setStops] = useState(() => stopsInOrder(bookings, null));
  useEffect(() => {
    void requestPosition().then((here) => (here ? setStops(stopsInOrder(bookings, here)) : undefined));
    // Asked once, when the screen opens.
  }, []);
  const shown = stops[kind];
  const start = shown[0]?.point ?? { lat: 0, lng: 0 };
  const { box, view, failed, retry } = useMapView(map, start, true);
  const navigator = useNavigator();
  const elements = useMemo(() => shown.map(() => document.createElement('span')), [shown]);
  useEffect(() => {
    if (!view) return;
    view.pins(shown.map((stop, index) => ({ point: stop.point, element: elements[index] as HTMLElement })));
    view.fit(shown.map((stop) => stop.point));
  }, [view, shown, elements]);
  const passengers = bookings
    .filter((booking) => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.seats, 0);
  const title = t('way.map.title', {
    day: shortDay(tashkentDate(trip.departAt), now),
    time: formatTime(new Date(trip.departAt)),
    count: String(passengers),
  });
  const open = kind === 'pickups' ? onPoint : null;
  return (
    <div className="trip-map">
      {/* The open sheet of navigators takes «Назад» and the main button first (docs/94 C6). */}
      <Screen onBack={navigator.asking ? navigator.cancel : onBack} />
      <div ref={box} className="trip-map-box" hidden={failed} data-state={view ? 'ready' : 'loading'} />
      {failed ? <MapRetry onRetry={retry} /> : null}
      <section className="trip-map-sheet">
        <h2 className="trip-map-title">{title}</h2>
        {shown.map((stop, index) => (
          <StopCard
            key={stop.id}
            stop={stop}
            number={index + 1}
            place={kind === 'pickups' ? trip.from : trip.to}
            onOpen={open ? () => open(stop) : null}
          />
        ))}
      </section>
      {elements.map((element, index) =>
        createPortal(
          <span className="trip-map-pin" style={{ color: bg }}>
            <Icon name="pickup" size={MEETING_PIN} color={brandStrong} filled />
          </span>,
          element,
          shown[index]?.id,
        ),
      )}
      <NavigatorSheet navigator={navigator} />
      {shown.length > 0 && !navigator.asking ? (
        <MainButton text={t('way.map.go')} onClick={() => navigator.go(shown.map((stop) => stop.point))} />
      ) : null}
    </div>
  );
}
