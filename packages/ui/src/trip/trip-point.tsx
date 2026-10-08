import { roadMs, type Point } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

const HOUR_MS = 60 * 60 * 1000;

type Props = {
  readonly kind: 'from' | 'to';
  readonly name: string;
  readonly note: string;
  // A point with its place opens it in a map (docs/70, docs/126); without one it is plain text.
  readonly place?: Point | null;
  readonly onPoint?: ((point: Point) => void) | undefined;
};

// One end of a trip on its card (G60, G63): the green or red ring, the name and the line under it.
export function TripPoint({ kind, name, note, place = null, onPoint }: Props) {
  const content = (
    <>
      <span className="trip-card-dot" aria-hidden />
      <span className="trip-card-names">
        <span className="trip-card-name">{name}</span>
        <span className="trip-card-note">{note}</span>
      </span>
    </>
  );
  const className = `trip-card-point trip-card-${kind}`;
  return place && onPoint ? (
    <button type="button" className={className} onClick={() => onPoint(place)}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

// «≈ 300 km · ≈ 5 soat yoʻl» between the two ends (mockups g60/7, g63/4 screen 6).
export function TripRoad({ km }: { readonly km: number }) {
  const { t } = useI18n();
  const hours = String(Math.round(roadMs(km) / HOUR_MS));
  return <span className="trip-card-road">{t('find.road', { km: String(km), hours })}</span>;
}
