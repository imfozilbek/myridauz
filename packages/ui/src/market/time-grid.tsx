import { haptic } from '../telegram/feedback';

type Cell = {
  readonly slot: string;
  readonly pressed: boolean;
  // Inside a chosen range: lighter than its ends (mockup g90 phone 3).
  readonly inside?: boolean;
  readonly onTap: (slot: string) => void;
};

// One time as a tile; the chosen one in the main color of the app.
export function TimeCell({ slot, pressed, inside = false, onTap }: Cell) {
  return (
    <button
      type="button"
      className={inside ? 'time-cell time-cell-inside' : 'time-cell'}
      aria-pressed={pressed}
      onClick={() => {
        haptic.select();
        onTap(slot);
      }}
    >
      {slot}
    </button>
  );
}

type Props = {
  readonly slots: readonly string[];
  readonly time: string | null;
  readonly onTime: (time: string) => void;
};

// The times the driver may leave at as tiles, six in a row (G75, mockup g75/3 A phone 1): only the
// free ones of the kind on the switch (owner decisions 12.10.2026).
export function TimeGrid({ slots, time, onTime }: Props) {
  return (
    <div className="time-grid">
      {slots.map((slot) => (
        <TimeCell key={slot} slot={slot} pressed={slot === time} onTap={onTime} />
      ))}
    </div>
  );
}
