import type { BrandColors } from '@platform/brands';
import { ownLook } from './own-look';

type Kind = {
  readonly destructive: boolean;
  readonly disabled: boolean;
  readonly beside: boolean;
  readonly under: boolean;
};

// The main button in the brand color, red when dangerous, gray while inert. The secondary: soft
// beside the main one (G76), a link of the screen under it (G83), else the own look of Telegram.
export function lookOf(
  colored: boolean,
  colors: BrandColors,
  { destructive, disabled, beside, under }: Kind,
) {
  const look = disabled
    ? { backgroundColor: colors.disabled, textColor: colors.disabledText }
    : { backgroundColor: destructive ? colors.danger : colors.brandStrong, textColor: colors.bg };
  if (colored) return look;
  const soft = { backgroundColor: colors.brandSoft, textColor: colors.brandText };
  if (beside) return { ...(disabled ? look : soft), position: 'left' as const };
  return under
    ? { backgroundColor: colors.bgGrouped, textColor: colors.brandText, position: 'bottom' as const }
    : ownLook();
}
