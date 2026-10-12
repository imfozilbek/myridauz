import type { ReactNode } from 'react';
import { haptic } from '../telegram/feedback';

type Chip<T extends string> = { readonly id: T; readonly label: ReactNode };

type ChipsProps<T extends string> = {
  readonly label: string;
  readonly chips: readonly Chip<T>[];
  // Nothing chosen yet: «Qoʻshish» or «Ayirish», the reason (G78 sheet 4).
  readonly value: T | null;
  readonly onChange: (value: T) => void;
  // Many long chips go on to the next line instead of sideways.
  readonly wrap?: boolean;
};

// One choice of a few as chips (mockup g67/1): the chosen one dark. The filter of «Navbat», the
// period of «Statistika», the account, the act and the reason of «Hamyonni tuzatish» (G78 sheet 4).
export function ManageChips<T extends string>({
  label,
  chips,
  value,
  onChange,
  wrap = false,
}: ChipsProps<T>) {
  return (
    <div
      className={wrap ? 'navbat-chips manage-chips-wrap' : 'navbat-chips'}
      role="radiogroup"
      aria-label={label}
    >
      {chips.map(({ id, label: words }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={id === value}
          className={id === value ? 'navbat-chip navbat-chip-on' : 'navbat-chip'}
          onClick={() => {
            haptic.select();
            onChange(id);
          }}
        >
          {words}
        </button>
      ))}
    </div>
  );
}
