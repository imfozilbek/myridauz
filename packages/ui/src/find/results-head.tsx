import { HOUR_MS, roadMs, type Location } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useRegionArt } from '../places/region-art';
import type { Route } from '../places/route-screen';

type Props = {
  readonly route: Route;
  readonly from: Location; // the region of the start: «Toshkent shahri → …» (mockup screen 5)
  readonly region: Location;
  readonly km: number | null;
  // The trips of the week on the route: said for a search of a whole region (G100).
  readonly week: number;
};

// A region searched whole (not a city that is a region): its trips leave from many places, so one time
// of the road would argue with the time of each card (G100, prod 16.11.2026).
const wholeRegion = (place: Location) => place.parentId === null && !place.oneCity;

// The head of «Safarlar»: the drawing of the region of the end, the route in full, «≈ 300 km · ≈ 5 soat»
// or, for a whole region, «Haftada 3 ta safar»
// (docs/118 path 2, docs/121: the region in the title, the full names, no shortening).
export function ResultsHead({ route, from, region, km, week }: Props) {
  const { t } = useI18n();
  const art = useRegionArt()(region.id);
  return (
    <div className="results-head">
      {art ? <img className="results-art" src={art} alt={route.to.name} /> : null}
      <div className="results-text">
        <h1 className="results-title">{t('common.route', { from: from.name, to: route.to.name })}</h1>
        {wholeRegion(route.from) || wholeRegion(route.to) ? (
          week > 0 ? (
            <p className="results-way">{t('find.weekTrips', { count: String(week) })}</p>
          ) : null
        ) : km === null ? null : (
          <p className="results-way">
            {t('find.way', { km: String(km), hours: String(Math.round(roadMs(km) / HOUR_MS)) })}
          </p>
        )}
      </div>
    </div>
  );
}
