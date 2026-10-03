import type { BookingMode, Trip } from '@platform/contracts';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import type { RememberedWay } from '../way/remembered-way';
import type { WayEnd } from '../way/way-end';

const STEPS = ['mode', 'pickup', 'dropoff', 'review'] as const;
export type BookStepName = (typeof STEPS)[number];
type Saved = {
  readonly step: BookStepName;
  readonly seats: number;
  readonly mode: BookingMode | null;
  readonly pickup: WayEnd | null;
  readonly dropoff: WayEnd | null;
  // The way came from the last trip on the route (G35, docs/97 K4): «Назад» of the check is the trip.
  readonly kept: boolean;
  // A step opened by «Oʻzgartirish» of the check: its «Назад» and its answer go back to the check.
  readonly editing: boolean;
};

const isPoint = (end: unknown) =>
  end === null || typeof asRecord(asRecord(end)?.['place'])?.['id'] === 'string';

// The step that still has no answer: a way, the door point for «Uyimdan», the point at the end.
type Answers = Pick<Saved, 'mode' | 'pickup' | 'dropoff'>;
const nextStep = ({ mode, pickup, dropoff }: Answers): BookStepName =>
  !mode ? 'mode' : mode === 'door' && !pickup ? 'pickup' : !dropoff ? 'dropoff' : 'review';

// A booking kept as a draft of its trip (docs/94 F3, F8): the seats, the way and both points come
// back on «Назад» and in a reopened app; a way the trip no longer has drops the draft. Without a
// draft the way of the last trip on this route opens the check at once (G35, docs/97 K3, K4).
export function useBooking(trip: Trip, ways: readonly BookingMode[], last: RememberedWay | null) {
  const check = (value: unknown): Saved | null => {
    const saved = asRecord(value);
    if (!saved || !STEPS.some((step) => step === saved['step'])) return null;
    const { seats, mode, pickup, dropoff, kept, editing } = saved;
    const fits =
      typeof seats === 'number' &&
      typeof kept === 'boolean' &&
      typeof editing === 'boolean' &&
      (mode === null || ways.some((way) => way === mode)) &&
      isPoint(pickup) &&
      isPoint(dropoff);
    return fits ? (saved as Saved) : null;
  };
  const only = ways.length === 1 ? (ways[0] ?? null) : null;
  // «Farqi yoʻq» of a request: the door when the trip takes it, the pitak otherwise.
  const wanted = last?.mode === 'both' ? (ways.includes('door') ? 'door' : 'pitak') : last?.mode;
  const mode = ways.find((way) => way === wanted);
  const answers =
    last && mode
      ? {
          seats: 1,
          mode,
          pickup: mode === 'door' ? last.pickup : null,
          dropoff: last.dropoff,
          kept: true,
          editing: false,
        }
      : { seats: 1, mode: only, pickup: null, dropoff: null, kept: false, editing: false };
  const start: Saved = { step: nextStep(answers), ...answers };
  const { value, setValue, restored, clear } = useFlowDraft(`booking:${trip.id}`, check, start);
  const patch = (change: Partial<Saved>) => setValue((saved) => ({ ...saved, ...change }));
  // An answer given: the next step without an answer, the check when all are there.
  const answer = (change: Partial<Saved>) =>
    setValue((saved) => {
      const next = { ...saved, ...change, editing: false };
      return { ...next, step: nextStep(next) };
    });
  return { ...value, restored, clear, patch, answer };
}
