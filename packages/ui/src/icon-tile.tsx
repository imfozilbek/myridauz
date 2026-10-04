import { useBrand } from './context/brand-context';
import { Icon, type IconName } from './icons';

export type Tone = 'brand' | 'accent' | 'deep' | 'danger';

export const SIZES = {
  cell: { tile: 30, icon: 18, radius: 8 },
  // A tile of the main screen (G53).
  tile: { tile: 40, icon: 22, radius: 11 },
  hero: { tile: 96, icon: 52, radius: 26 },
} as const;

type IconTileProps = {
  readonly name: IconName;
  readonly tone?: Tone;
  readonly size?: keyof typeof SIZES;
  // The tiles of the main screen: the icon in its color on the same color light (the mockup of G53).
  readonly soft?: boolean;
};

const SOFT_SHARE = '14%';

// A white icon on a colored rounded tile, like Telegram settings (docs/21). The second color
// is its strong tone: a white icon on it stays readable (at least 3:1, docs/20).
export function IconTile({ name, tone = 'brand', size = 'cell', soft = false }: IconTileProps) {
  const { colors } = useBrand().theme;
  const strong = {
    brand: colors.brandStrong,
    accent: colors.accentStrong,
    deep: soft ? colors.text : colors.brandDeep,
    danger: colors.danger,
  }[tone];
  const background = soft ? `color-mix(in srgb, ${strong} ${SOFT_SHARE}, ${colors.bg})` : strong;
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
      <Icon name={name} size={icon} color={soft ? strong : colors.bg} />
    </span>
  );
}
