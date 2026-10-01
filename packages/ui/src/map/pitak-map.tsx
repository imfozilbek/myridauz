import type { Pitak } from '@platform/contracts';
import { useEffect } from 'react';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useMapView } from './use-map-view';
import './pickup-map.css';

// The pitak of a direction on a small map (G26, docs/74): where the driver waits. Without a map the
// screen still works: the name of the pitak is next to it, the map is only a picture.
export function PitakMap({ pitak }: { readonly pitak: Pitak }) {
  const { map } = useApiClients();
  const { colors } = useBrand().theme;
  const { t } = useI18n();
  const { box, view } = useMapView(map, pitak.point);
  useEffect(() => {
    view?.show([{ point: pitak.point, color: colors.text, label: t('way.mark.pitak') }], null);
  }, [view, pitak, colors, t]);
  return <div ref={box} className="pitak-map" data-state={view ? 'ready' : 'loading'} />;
}
