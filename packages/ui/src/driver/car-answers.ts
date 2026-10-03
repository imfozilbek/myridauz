import { carSchema, type CarInput } from '@platform/contracts';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import { useDraft } from '../screen/draft';
import { isStep, type Step } from './application-steps';

const FIELDS = ['make', 'model', 'color', 'plate', 'seats'] as const;
const DRAFT_KEY = 'application';

// The step and the car of the application. make: a make chosen from the list that waits for its
// model (docs/94 B5): «Назад» on the model drops it, so a new make never pairs with the old model.
type Saved = { readonly step: Step; readonly car: Partial<CarInput>; readonly make: string | null };

// The draft of an older version of the app is dropped when its step or its car does not fit.
function checkSaved(value: unknown): Saved | null {
  const saved = asRecord(value);
  const make = saved?.['make'];
  if (!saved || !isStep(saved['step']) || !(make === null || typeof make === 'string')) return null;
  if (!carSchema.partial().safeParse(saved['car']).success) return null;
  return { step: saved['step'], car: saved['car'] as Partial<CarInput>, make };
}

export const carReady = (car: Partial<CarInput>) => carSchema.safeParse(car).success;

// The car of an application not sent yet, as the main screen counts it (G34).
export const useDraftCar = () => useDraft(DRAFT_KEY, checkSaved).restored?.car ?? {};

// The answers are kept as a draft after every step (docs/94 F3): a closed app reopens the
// application where it stopped. A sent application being changed starts from what was sent.
export function useCarAnswers(known: Partial<CarInput> | undefined) {
  const start: Saved = { step: known ? 'review' : 'make', car: known ?? {}, make: null };
  const { value, setValue, restored, clear } = useFlowDraft(
    DRAFT_KEY,
    checkSaved,
    start,
    known !== undefined,
  );
  const { step, car, make } = value;
  const shown = make === null ? car : { ...car, make };
  // A make alone is kept aside; with its model (or a popular car) it joins the car.
  const answer = (patch: Partial<CarInput>, alone: boolean, nextOf: (next: Partial<CarInput>) => Step) => {
    const next = alone ? car : { ...shown, ...patch };
    setValue({ step: nextOf(next), car: next, make: alone ? (patch.make ?? null) : null });
  };
  // Another screen without an answer: a make that waits for its model is dropped.
  const go = (to: Step) => setValue({ step: to, car, make: null });
  // Typed or chosen data that is not sent yet: leaving asks first (docs/94 F3).
  const dirty = make !== null || FIELDS.some((field) => car[field] !== known?.[field]);
  return { step, car, shown, answer, go, dirty, restored, clear };
}
