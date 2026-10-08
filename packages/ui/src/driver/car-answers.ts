import { carSchema, type CarInput } from '@platform/contracts';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import { isStep, type Step } from './application-steps';

const FIELDS = ['make', 'model', 'color', 'plate', 'seats'] as const;
const DRAFT_KEY = 'application';

type Saved = { readonly step: Step; readonly car: Partial<CarInput> };

// The plate is kept as it is typed, a part of it too: the full rule is checked on sending.
const PLATE_TYPED_MAX = 16;
const savedCar = carSchema.omit({ plate: true }).partial();
const fits = (car: unknown) => {
  const plate = asRecord(car)?.['plate'];
  const typed = plate === undefined || (typeof plate === 'string' && plate.length <= PLATE_TYPED_MAX);
  return typed && savedCar.safeParse(car).success;
};

// The draft of an older version of the app is dropped when its step or its car does not fit.
function checkSaved(value: unknown): Saved | null {
  const saved = asRecord(value);
  if (!saved || !isStep(saved['step']) || !fits(saved['car'])) return null;
  return { step: saved['step'], car: saved['car'] as Partial<CarInput> };
}

// The answers are kept as a draft after every change (docs/94 F3): a closed app reopens the
// application where it stopped. A sent application being changed starts from what was sent.
export function useCarAnswers(known: Partial<CarInput> | undefined, first: Step) {
  const { value, setValue, restored, clear } = useFlowDraft(
    DRAFT_KEY,
    checkSaved,
    { step: first, car: known ?? {} },
    known !== undefined,
  );
  const { step, car } = value;
  const change = (patch: Partial<CarInput>) => setValue({ step, car: { ...car, ...patch } });
  const go = (to: Step) => setValue({ step: to, car });
  // Typed or chosen data that is not sent yet: leaving asks first (docs/94 F3).
  const dirty = FIELDS.some((field) => car[field] !== known?.[field]);
  return { step, car, change, go, dirty, restored, clear };
}
