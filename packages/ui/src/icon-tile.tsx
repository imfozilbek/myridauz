import { useBrand } from './context/brand-context';
import { Icon, type IconName } from './icons';

export type Tone = 'brand' | 'accent' | 'deep' | 'danger';

export const SIZES = {
  cell: { tile: 30, icon: 18, radius: 8 },
  // A tile of the main screen (G53).
  tile: { tile: 40, icon: 22, radius: 11 },
  hero: { tile: 96, icon: 52, radius: 26 },
} as const;

type IconTileProps = { readonly name: IconName; readonly tone?: Tone; readonly size?: keyof typeof SIZES };

// A white icon on a colored rounded tile, like Telegram settings (docs/21). The second color
// is its strong tone: a white icon on it stays readable (at least 3:1, docs/20).
export function IconTile({ name, tone = 'brand', size = 'cell' }: IconTileProps) {
  const { colors } = useBrand().theme;
  const background = {
    brand: colors.brandStrong,
    accent: colors.accentStrong,
    deep: colors.brandDeep,
    danger: colors.danger,
  }[tone];
  const { tile, icon, radius } = SIZES[size];
  const style = {
    width: tile,
    height: tile,
    borderRadius: radius,
    background,
    display: 'grid',
    placeItems: 'center',
  };
  return (
    <span style={style}>
      <Icon name={name} size={icon} color={colors.bg} />
    </span>
  );
}
