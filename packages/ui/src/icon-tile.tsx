import { useBrand } from './context/brand-context';
import { Icon, type IconName } from './icons';

export type Tone = 'brand' | 'mint' | 'accent' | 'deep' | 'danger';

const SIZES = {
  cell: { tile: 30, icon: 18, radius: 8 },
  // A tile of the main screen (G53).
  tile: { tile: 40, icon: 22, radius: 11 },
  // A big choice tile, the gender of the registration (G58).
  large: { tile: 52, icon: 28, radius: 14 },
  hero: { tile: 96, icon: 52, radius: 26 },
} as const;

type IconTileProps = {
  readonly name: IconName;
  readonly tone?: Tone;
  readonly size?: keyof typeof SIZES;
  // The tiles of the main screen: the icon in its color on the same color light (the mockup of G53).
  readonly soft?: boolean;
};

// A white icon on a colored rounded tile, like Telegram settings (docs/21). The second color
// is its strong tone: a white icon on it stays readable (at least 3:1, docs/20).
export function IconTile({ name, tone = 'brand', size = 'cell', soft = false }: IconTileProps) {
  const { colors } = useBrand().theme;
  // The soft look of the mockup: brand on its light color, the second color on its light color,
  // the gray tile with a dark icon (G53).
  const softLook: Record<Tone, readonly [string, string]> = {
    brand: [colors.brandSoft, colors.brandText],
    // A stronger light color: on a light tile it still shows (the mockup of G58).
    mint: [colors.brandMint, colors.brandText],
    accent: [colors.accentSoft, colors.accent],
    deep: [colors.neutralSoft, colors.neutralText],
    danger: [colors.attentionSoft, colors.danger],
  };
  const solid: Record<Tone, string> = {
    brand: colors.brandStrong,
    mint: colors.brandStrong,
    accent: colors.accentStrong,
    deep: colors.brandDeep,
    danger: colors.danger,
  };
  const [background, ink] = soft ? softLook[tone] : [solid[tone], colors.bg];
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
      <Icon name={name} size={icon} color={ink} />
    </span>
  );
}
