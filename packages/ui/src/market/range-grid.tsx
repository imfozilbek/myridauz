import { HOUR_MS, rangeEnds, slotAt, tashkentTime } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { TimeCell } from './time-grid';

export type Range = { readonly from: string; readonly to: string };

type Props = {
  readonly date: string;
  // The whole hours with at least one end (docs/216, lesson 248).
  readonly starts: readonly string[];
  // The start tapped at step 1; null: step 1.
  readonly from: string | null;
  // The range chosen before, seen when the sheet opens again until a tap (mockup g90 phone 3).
  readonly chosen: Range | null;
  readonly onFrom: (from: string | null) => void;
  readonly onTo: (to: string) => void;
};

// Every whole hour of a range, its ends too: "08:00", "09:00", "10:00".
const hoursOf = (date: string, { from, to }: Range) => {
  const start = slotAt(date, from);
  const count = (slotAt(date, to) - start) / HOUR_MS + 1;
  return Array.from({ length: count }, (_, index) => tashkentTime(start + index * HOUR_MS));
};

// «Oraliqda» (owner decision 20.10.2026, docs/216): step 1 the start, step 2 the start and only its
// ends; the start again goes back to step 1, an end closes the sheet. A chosen range shows its ends in
// the main color and the hours inside lighter; any tap starts a new choice.
export function RangeGrid({ date, starts, from, chosen, onFrom, onTo }: Props) {
  const rules = useBrand().schedule;
  if (from) {
    const ends = rangeEnds(date, from, rules);
    return (
      <div className="time-grid">
        {[from, ...ends].map((slot) => (
          <TimeCell
            key={slot}
            slot={slot}
            pressed={slot === from}
            onTap={(tapped) => (tapped === from ? onFrom(null) : onTo(tapped))}
          />
        ))}
      </div>
    );
  }
  const seen = chosen ? hoursOf(date, chosen) : [];
  const tiles = [...new Set([...starts, ...seen])].sort();
  const edge = (slot: string) => slot === chosen?.from || slot === chosen?.to;
  return (
    <div className="time-grid">
      {tiles.map((slot) => (
        <TimeCell
          key={slot}
          slot={slot}
          pressed={edge(slot)}
          inside={seen.includes(slot) && !edge(slot)}
          // The end of a range late in the day may be no start: its tap only clears the choice.
          onTap={(tapped) => onFrom(starts.includes(tapped) ? tapped : null)}
        />
      ))}
    </div>
  );
}
