import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';

export type OwnTripTile = 'share' | 'story' | 'change' | 'map';

const TILES: readonly (readonly [OwnTripTile, IconName, TranslationKey])[] = [
  ['share', 'share', 'bookings.toClose'],
  ['story', 'story', 'driverTrip.tile.story'],
  ['change', 'edit', 'driverTrip.tile.change'],
  ['map', 'navigate', 'driverTrip.tile.map'],
];
const TILE_ICON = 16;

// Four tiles under the trip (mockup g63/3): the close people, the story, the time or the price and
// the map of the way. They never hide (docs/121): a tile that cannot work now says why on its tap.
export function OwnTripTiles({ onTile }: { readonly onTile: (tile: OwnTripTile) => void }) {
  const { t } = useI18n();
  return (
    <div className="own-tiles">
      {TILES.map(([tile, icon, label]) => (
        <button key={tile} type="button" className="own-tile" onClick={() => onTile(tile)}>
          <Icon name={icon} size={TILE_ICON} />
          <span>{t(label)}</span>
        </button>
      ))}
    </div>
  );
}
