import { roadMs, type Location } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useRegionArt } from '../places/region-art';
import type { Route } from '../places/route-screen';

const HOUR_MS = 60 * 60 * 1000;

type Props = { readonly route: Route; readonly region: Location | undefined; readonly km: number | null };

// The head of «Safarlar»: the drawing of the region of the end, the route in full, «≈ 300 km · ≈ 5 soat»
// (docs/118 path 2, docs/121: the region in the title, the full names, no shortening).
export function ResultsHead({ route, region, km }: Props) {
  const { t } = useI18n();
  const art = useRegionArt()(region?.id ?? route.to.id);
  return (
    <div className="results-head">
      {art ? <img className="results-art" src={art} alt={route.to.name} /> : null}
      <div className="results-text">
        <h1 className="results-title">{t('common.route', { from: route.from.name, to: route.to.name })}</h1>
        {km === null ? null : (
          <p className="results-way">
            {t('find.way', { km: String(km), hours: String(Math.round(roadMs(km) / HOUR_MS)) })}
          </p>
        )}
      </div>
    </div>
  );
}
