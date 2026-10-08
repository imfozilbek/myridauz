import type { Point } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MapRetry } from '../map/map-retry';
import { useMapView } from '../map/use-map-view';
import './meeting-map.css';

// The pin of a meeting point, as tall as on the mockups g63/4 screens 12 and 13.
const MEETING_PIN = 34;

type Props = {
  readonly point: Point;
  readonly onOpen: () => void;
  // A smaller pin where the map is a strip under a row (the pitak of the new trip, screen 3).
  readonly pin?: number;
};

// The small map of a meeting point (docs/126): it does not move, the point stays in its middle
// under the tip of the pin of the color of the app, as on the big map; a tap opens the big map.
export function MeetingMap({ point, onOpen, pin = MEETING_PIN }: Props) {
  const { map } = useApiClients();
  const { t } = useI18n();
  const { bg, brandStrong } = useBrand().theme.colors;
  const { box, view, failed, retry } = useMapView(map, point, true);
  if (failed) return <MapRetry onRetry={retry} />;
  return (
    <button type="button" className="meeting-map" aria-label={t('bookings.openMap')} onClick={onOpen}>
      <div ref={box} className="meeting-map-box" data-state={view ? 'ready' : 'loading'} />
      <span className="meeting-map-pin" style={{ color: bg }}>
        <Icon name="pickup" size={pin} color={brandStrong} filled />
      </span>
    </button>
  );
}
