import type { Point } from '@platform/contracts';
import { useEffect } from 'react';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { MapRetry } from '../map/map-retry';
import { useMapView } from '../map/use-map-view';
import './meeting-map.css';

// The small map of a meeting point (docs/126): it does not move; a tap opens the big map.
export function MeetingMap({ point, onOpen }: { readonly point: Point; readonly onOpen: () => void }) {
  const { map } = useApiClients();
  const { t } = useI18n();
  const { brandStrong } = useBrand().theme.colors;
  const { box, view, failed, retry } = useMapView(map, point, true);
  useEffect(() => {
    view?.show([{ point, color: brandStrong }], null);
    // The view draws the mark once it is ready.
  }, [view]);
  if (failed) return <MapRetry onRetry={retry} />;
  return (
    <button type="button" className="meeting-map" aria-label={t('bookings.openMap')} onClick={onOpen}>
      <div ref={box} className="meeting-map-box" data-state={view ? 'ready' : 'loading'} />
    </button>
  );
}
