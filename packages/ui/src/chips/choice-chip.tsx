import type { ReactNode } from 'react';
import './choice-chip.css';

type Props = {
  readonly children: ReactNode;
  readonly onClick: () => void;
  // One answer of a group is a radio («Pitakdan», G63); a choice of a list is pressed («Cobalt», G62);
  // neither: a chip that only opens something («Boshqa ›»).
  readonly checked?: boolean;
  readonly pressed?: boolean;
  // md: a choice on its own screen (mockup g62/1); sm: a choice inside a row (mockup g63/2).
  readonly size?: 'sm' | 'md';
};

// A rounded chip of one choice: the chosen one in the strong color of the app on its light color.
export function ChoiceChip({ children, onClick, checked, pressed, size = 'md' }: Props) {
  const radio = checked === undefined ? {} : { role: 'radio', 'aria-checked': checked };
  return (
    <button
      type="button"
      className={`choice-chip choice-chip-${size}`}
      {...radio}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
