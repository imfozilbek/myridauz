import { rangeEnds } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { TimeCell } from './time-grid';

type Range = { readonly from: string; readonly to: string };

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
  // A chosen range shows its start and the ends of that start, as at step 2 (mockup g90 phone 3).
  const tiles = chosen ? [chosen.from, ...rangeEnds(date, chosen.from, rules)] : starts;
  const edge = (slot: string) => slot === chosen?.from || slot === chosen?.to;
  return (
    <div className="time-grid">
      {tiles.map((slot) => (
        <TimeCell
          key={slot}
          slot={slot}
          pressed={edge(slot)}
          inside={chosen !== null && slot > chosen.from && slot < chosen.to}
          // An end late in the day may be no start: its tap only clears the choice.
          onTap={(tapped) => onFrom(starts.includes(tapped) ? tapped : null)}
        />
      ))}
    </div>
  );
}
