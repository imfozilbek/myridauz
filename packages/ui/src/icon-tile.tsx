import { useBrand } from './context/brand-context';
import { Icon, type IconName } from './icons';

export type Tone = 'brand' | 'accent' | 'deep';

const SIZES = { cell: { tile: 30, icon: 18, radius: 8 }, hero: { tile: 96, icon: 52, radius: 26 } } as const;

type IconTileProps = { readonly name: IconName; readonly tone?: Tone; readonly size?: keyof typeof SIZES };

// A white icon on a colored rounded tile, like Telegram settings (docs/21).
export function IconTile({ name, tone = 'brand', size = 'cell' }: IconTileProps) {
  const { colors } = useBrand().theme;
  const background = { brand: colors.brandStrong, accent: colors.accent, deep: colors.brandDeep }[tone];
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
