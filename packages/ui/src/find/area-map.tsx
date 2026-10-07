import type { Location } from '@platform/contracts';
import { useEffect } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { MapRetry } from '../map/map-retry';
import { useMapView } from '../map/use-map-view';
import '../map/pickup-map.css';

// The area around the start of the trip (docs/126, docs/69): before a booking a passenger sees only
// a circle of the district, the exact point opens after the confirmation.
const AREA_KM = 2;

export function AreaMap({ place }: { readonly place: Location }) {
  const { map } = useApiClients();
  const { t } = useI18n();
  const center = { lat: place.lat, lng: place.lng };
  const { box, view, failed, retry } = useMapView(map, center, true);
  useEffect(() => {
    view?.area(center, AREA_KM);
    // The view draws the circle once it is ready.
  }, [view]);
  return (
    <div className="area-map">
      {failed ? <MapRetry onRetry={retry} /> : null}
      <div ref={box} className="area-map-box" hidden={failed} data-state={view ? 'ready' : 'loading'} />
      <p className="area-map-note">{t('find.areaNote')}</p>
    </div>
  );
}
