import type { BookingMode, Trip } from '@platform/contracts';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import type { WayEnd } from '../way/way-end';

const STEPS = ['seats', 'mode', 'pickup', 'dropoff', 'review'] as const;
export type BookStepName = (typeof STEPS)[number];
type Saved = {
  readonly step: BookStepName;
  readonly seats: number | null;
  readonly mode: BookingMode | null;
  readonly pickup: WayEnd | null;
  readonly dropoff: WayEnd | null;
};

const isPoint = (end: unknown) => end === null || typeof asRecord(asRecord(end)?.['place'])?.['id'] === 'string';

// A booking kept as a draft of its trip (docs/94 F3, F8): the seats, the way and both points come
// back on «Назад» and in a reopened app; a way the trip no longer has drops the draft.
export function useBooking(trip: Trip, ways: readonly BookingMode[]) {
  const check = (value: unknown): Saved | null => {
    const saved = asRecord(value);
    if (!saved || !STEPS.some((step) => step === saved['step'])) return null;
    const { seats, mode, pickup, dropoff } = saved;
    const fits =
      (seats === null || typeof seats === 'number') &&
      (mode === null || ways.some((way) => way === mode)) &&
      isPoint(pickup) &&
      isPoint(dropoff);
    return fits ? (saved as Saved) : null;
  };
  const only = ways.length === 1 ? (ways[0] ?? null) : null;
  const start: Saved = { step: 'seats', seats: null, mode: only, pickup: null, dropoff: null };
  const { value, setValue, restored, clear } = useFlowDraft(`booking:${trip.id}`, check, start);
  const patch = (change: Partial<Saved>) => setValue((saved) => ({ ...saved, ...change }));
  return { ...value, restored, clear, patch };
}
