import type { ReactNode } from 'react';
import { useBrand } from './context/brand-context';
import { Icon } from './icons';
import { usePlatform } from './telegram/in-telegram-context';

const CHEVRON_SIZE = 20;

// A row that opens a screen ends with a chevron on iOS only, like Telegram itself (docs/21).
export function useChevron() {
  const ios = usePlatform() === 'ios';
  const { colors } = useBrand().theme;
  return (after?: ReactNode): ReactNode => {
    if (!ios) return after ?? null;
    return (
      <span className="cell-after">
        {after}
        <Icon name="next" size={CHEVRON_SIZE} color={colors.textMuted} />
      </span>
    );
  };
}
