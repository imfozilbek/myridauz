import type { Location, PlaceTrips } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import type { PlaceDirectory } from './directory';
import './district-list.css';

const TILE_ICON = 20;
const CHEVRON = 18;

// The trips of the week of a route: in all the region and by the place they go to (G75).
export type RegionTrips = { readonly total: number; readonly places: readonly PlaceTrips[] };

type Props = {
  readonly region: Location;
  readonly directory: PlaceDirectory;
  readonly allowWholeRegion: boolean;
  readonly trips?: RegionTrips | undefined;
  readonly onPick: (place: Location) => void;
  readonly onWhole: () => void;
};

// «Samarqandning qaysi joyi?» (G75, mockup g75/6 A): the whole region in its own white card, then the
// places in one card; with the trips of the week each says how many go there, the busiest first.
export function DistrictList({ region, directory, allowWholeRegion, trips, onPick, onWhole }: Props) {
  const { t } = useI18n();
  const count = (to: string) => trips?.places.find((place) => place.to === to)?.trips ?? 0;
  const places = [...directory.inside(region.id)];
  if (trips) places.sort((a, b) => count(b.id) - count(a.id));
  const hint = (value: number) => (trips ? t('places.trips', { count: String(value) }) : undefined);
  return (
    <>
      {allowWholeRegion ? (
        <div className="district-card">
          <PlaceRow
            icon="map"
            className="district-whole"
            title={t(region.oneCity ? 'places.wholeCity' : 'places.wholeRegion')}
            hint={hint(trips?.total ?? 0)}
            onClick={onWhole}
          />
        </div>
      ) : null}
      <div className="district-card">
        {places.map((place) => (
          <PlaceRow
            key={place.id}
            icon="place"
            className="district-row"
            title={place.name}
            hint={hint(count(place.id))}
            onClick={() => onPick(place)}
          />
        ))}
      </div>
    </>
  );
}

type RowProps = {
  readonly icon: IconName;
  readonly className: string;
  readonly title: string;
  readonly hint: string | undefined;
  readonly onClick: () => void;
};

// One row of a place (G75, mockup g75/6 A): a tile, the name and a line under it, «›». The ends of a
// route are rows of it too.
export function PlaceRow({ icon, className, title, hint, onClick }: RowProps) {
  return (
    <button type="button" className={`district ${className}`} onClick={onClick}>
      <span className="district-tile">
        <Icon name={icon} size={TILE_ICON} />
      </span>
      <span className="district-words">
        <span>{title}</span>
        {hint ? <small>{hint}</small> : null}
      </span>
      <span className="district-chevron">
        <Icon name="next" size={CHEVRON} />
      </span>
    </button>
  );
}
