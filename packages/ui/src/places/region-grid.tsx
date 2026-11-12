import type { Location } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from './directory';
import { RegionTile, useRegionWords } from './region-tile';

type RegionGridProps = {
  readonly directory: PlaceDirectory;
  // A city that is a region is one tap, «Butun shahar» (G78 П9).
  readonly cityAtOnce: boolean;
  readonly onOpen: (region: Location) => void;
};

// The 14 regions as tiles: people find their region by the picture faster than by the name; the same
// tiles as «Qayerga borasiz?» (owner, 12.11.2026).
export function RegionGrid({ directory, cityAtOnce, onOpen }: RegionGridProps) {
  const { t } = useI18n();
  const words = useRegionWords(directory);
  return (
    <div className="region-tiles">
      {directory.regions.map((region) => (
        <RegionTile
          key={region.id}
          region={region}
          name={words.name(region)}
          hint={cityAtOnce && region.oneCity ? t('places.wholeCity') : words.districts(region)}
          onOpen={() => onOpen(region)}
        />
      ))}
    </div>
  );
}
