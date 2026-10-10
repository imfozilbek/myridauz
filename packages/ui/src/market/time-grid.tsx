import { SLOT_MINUTES } from '@platform/contracts';
import { useLayoutEffect, useRef } from 'react';
import { haptic } from '../telegram/feedback';

const SLOTS_A_DAY = (24 * 60) / SLOT_MINUTES;
const COLUMNS = 4;
const label = (index: number) => {
  const minutes = index * SLOT_MINUTES;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
};
const ALL = Array.from({ length: SLOTS_A_DAY }, (_, index) => label(index));

type Props = {
  readonly allowed: readonly string[];
  readonly time: string | null;
  readonly onTime: (time: string) => void;
};

// Every half hour of the day as a tile, four in a row (G75, mockup g75/3 A phone 1): the times the
// driver may not leave at are gray and do nothing; the chosen one stands in the middle row.
export function TimeGrid({ allowed, time, onTime }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const grid = box.current;
    const chosen = grid?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!grid || !chosen) return;
    grid.scrollTop = chosen.offsetTop - grid.offsetTop - (chosen.offsetHeight + 8);
  }, [time]);
  return (
    <div ref={box} className="time-grid" style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}>
      {ALL.map((slot) => (
        <button
          key={slot}
          type="button"
          className="time-chip"
          aria-pressed={slot === time}
          disabled={!allowed.includes(slot)}
          onClick={() => {
            haptic.select();
            onTime(slot);
          }}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
