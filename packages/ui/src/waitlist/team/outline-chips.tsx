import { haptic } from '../../telegram/feedback';
import './ads.css';

type Props<T extends string | number | null> = {
  readonly label: string;
  readonly options: readonly { readonly id: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

// The terms of an ad as equal chips in one row, the chosen one framed (mockup 7-team-ad-links): all by
// a tap, nothing to type.
export function OutlineChips<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div
      className="ad-chips"
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((option) => (
        <button
          key={String(option.id)}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          className={option.id === value ? 'ad-chip ad-chip-on' : 'ad-chip'}
          onClick={() => {
            haptic.select();
            onChange(option.id);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
