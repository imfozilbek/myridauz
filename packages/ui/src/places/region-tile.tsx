import type { Location } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { useFitLine } from '../screen/fit-line';
import type { PlaceDirectory } from './directory';
import { usePlaceNames } from './place-names';
import { useRegionArt } from './region-art';
import './region-tile.css';

type Props = {
  readonly region: Location;
  readonly name: string;
  readonly hint: string;
  // A line in the color of the app: the trips of a direction.
  readonly strong?: boolean;
  readonly onOpen: () => void;
};

// One tile of a region wherever a region is chosen, «Qayerdan» and «Qayerga», by a passenger and a
// driver (owner, 12.11.2026): its drawing small at the left, its name and one line beside it. Two
// columns, every region on one screen; the text never lies on the picture (docs/118).
export function RegionTile({ region, name, hint, strong = false, onOpen }: Props) {
  const art = useRegionArt()(region.id);
  // «Qoraqalpogʻiston» is one long word: smaller on a narrow phone, never broken (docs/121).
  const fitted = useFitLine<HTMLSpanElement>(name);
  return (
    <Tappable Component="button" className="region-tile" onClick={onOpen}>
      {art ? <img className="region-tile-art" src={art} alt={region.name} /> : null}
      <span className="region-tile-text">
        <span ref={fitted} className="region-tile-name">
          {name}
        </span>
        <span className="region-tile-hint" data-strong={strong}>
          {hint}
        </span>
      </span>
    </Tappable>
  );
}

// The words of a tile: the short name of a region, a city that is a region by its full name («Toshkent
// shahri», never «Toshkent»: docs/121), and how many districts it has (owner, 12.11.2026).
export function useRegionWords(directory: PlaceDirectory) {
  const { t } = useI18n();
  const names = usePlaceNames(directory);
  const name = (region: Location) => (region.oneCity ? region.name : names.short(region));
  const districts = (region: Location) => {
    const count = directory.inside(region.id).filter((place) => place.type === 'district').length;
    return t('places.districtCount', { count: String(count) });
  };
  return { name, districts };
}
