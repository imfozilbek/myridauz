import { arrivalAt, roadMs } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';

const HOUR_MS = 60 * 60 * 1000;

type Props = { readonly from: string; readonly to: string; readonly departAt: number; readonly km: number };

// The line of the way (docs/126): a trip to another city is no map but a line, «Chilonzor, Toshkent
// shahri 08:00 ● ≈ 300 km · ≈ 5 soat yoʻl ● Samarqand shahri ≈ 13:00». The place and its region by the
// rule of docs/121.
export function RouteLine({ from, to, departAt, km }: Props) {
  const { t, formatTime } = useI18n();
  const directory = usePlaces();
  const end = (id: string, time: string, approx: boolean, kind: 'from' | 'to') => {
    const place = directory.find(id);
    const region = place?.parentId ? directory.find(place.parentId) : undefined;
    return (
      <div className={`route-line-end route-line-${kind}`}>
        <span className="route-line-dot" aria-hidden />
        <span className="route-line-names">
          <span className="route-line-name">{place?.name ?? id}</span>
          {region ? <span className="route-line-region">{region.name}</span> : null}
        </span>
        <span className={approx ? 'route-line-time route-line-approx' : 'route-line-time'}>{time}</span>
      </div>
    );
  };
  return (
    <div className="safar-card route-line">
      {end(from, formatTime(new Date(departAt)), false, 'from')}
      <div className="route-line-way">
        {t('find.road', { km: String(km), hours: String(Math.round(roadMs(km) / HOUR_MS)) })}
      </div>
      {end(to, t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(departAt, km))) }), true, 'to')}
    </div>
  );
}
