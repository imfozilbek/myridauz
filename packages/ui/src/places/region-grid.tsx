import type { Location } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useRegionArt } from './region-art';

type RegionGridProps = {
  readonly regions: readonly Location[];
  readonly onOpen: (region: Location) => void;
};

// 14 regions as picture cards: people find their region by the picture faster than by the name.
// The name lies under the drawing on white, never on the picture (docs/118).
export function RegionGrid({ regions, onOpen }: RegionGridProps) {
  const artOf = useRegionArt();
  return (
    <div className="region-grid">
      {regions.map((region) => {
        const art = artOf(region.id);
        return (
          <button key={region.id} type="button" className="region-card" onClick={() => onOpen(region)}>
            {art ? <img className="region-photo" src={art} alt={region.name} loading="lazy" /> : null}
            <Text weight="2" className="region-name">
              {region.name}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
