import type { Pitak } from '@platform/contracts';
import { useEffect } from 'react';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useMapView } from '../map/use-map-view';
import type { WayEnd } from './way-end';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };

// The map behind the card (docs/71): the start, the end, the line between them and the pitak.
// Without a map the card still works: the map is only a picture here.
export function WayMap({ from, to, pitak }: { from: WayEnd | null; to: WayEnd | null; pitak: Pitak | null }) {
  const { map } = useApiClients();
  const { colors } = useBrand().theme;
  const { t } = useI18n();
  const { box, view } = useMapView(map, from?.point ?? to?.point ?? TASHKENT);
  useEffect(() => {
    if (!view) return;
    const a = from?.point ?? null;
    const b = to?.point ?? null;
    const marks = [
      ...(a ? [{ point: a, color: colors.brandStrong, label: t('way.mark.from') }] : []),
      ...(b ? [{ point: b, color: colors.accent, label: t('way.mark.to') }] : []),
      ...(pitak ? [{ point: pitak.point, color: colors.text, label: t('way.mark.pitak') }] : []),
    ];
    view.show(marks, a && b ? [a, b] : null);
    view.fit(marks.map((mark) => mark.point));
  }, [view, from, to, pitak, colors, t]);
  return <div ref={box} className="pickup-map-box" data-state={view ? 'ready' : 'loading'} />;
}
