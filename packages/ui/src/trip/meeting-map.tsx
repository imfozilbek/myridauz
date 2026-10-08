import type { Point } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MapRetry } from '../map/map-retry';
import { useMapView } from '../map/use-map-view';
import './meeting-map.css';

// The pin of the meeting point, as tall as on the mockups g63/4 screens 12 and 13.
const PIN = 34;

// The small map of a meeting point (docs/126): it does not move; a tap opens the big map. The pin of
// the colour of the app stands on the point in the middle, as on the big map (G22).
export function MeetingMap({ point, onOpen }: { readonly point: Point; readonly onOpen: () => void }) {
  const { map } = useApiClients();
  const { t } = useI18n();
  const { brandStrong } = useBrand().theme.colors;
  const { box, view, failed, retry } = useMapView(map, point, true);
  if (failed) return <MapRetry onRetry={retry} />;
  return (
    <button type="button" className="meeting-map" aria-label={t('bookings.openMap')} onClick={onOpen}>
      <div ref={box} className="meeting-map-box" data-state={view ? 'ready' : 'loading'} />
      <span className="meeting-map-pin">
        <Icon name="pickup" size={PIN} color={brandStrong} filled />
      </span>
    </button>
  );
}
