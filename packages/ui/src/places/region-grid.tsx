import type { Location } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useBrand } from '../context/brand-context';

type RegionGridProps = {
  readonly regions: readonly Location[];
  readonly onOpen: (region: Location) => void;
};

const photoUrl = (id: string) => `${import.meta.env.BASE_URL}regions/${id}.webp`;

// 14 regions as photo cards: people find their region by the picture faster than by the name.
export function RegionGrid({ regions, onOpen }: RegionGridProps) {
  const { regionPhotos } = useBrand();
  return (
    <div className="region-grid">
      {regions.map((region) => (
        <button key={region.id} type="button" className="region-card" onClick={() => onOpen(region)}>
          {regionPhotos ? (
            <img className="region-photo" src={photoUrl(region.id)} alt={region.name} loading="lazy" />
          ) : null}
          <Text weight="2" className="region-name">
            {region.name}
          </Text>
        </button>
      ))}
    </div>
  );
}
