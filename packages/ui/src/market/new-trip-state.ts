import type { Recommendation, TripStep } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import { useStepProgress } from '../flow/step-progress';
import type { Route } from '../places/route-screen';
import { returnDraft } from './return-trip';
import type { TripAgain, TripDraft } from './trip-draft';

const STEPS = ['route', 'mode', 'when', 'seats', 'price', 'comment', 'review'] as const;
export type Step = (typeof STEPS)[number];
// A new trip, the way back of the one just published, or the last trip again (G40, docs/106 K3):
// the last two ask only the day and go to the check.
const KINDS = ['new', 'return', 'again'] as const;
export type TripKind = (typeof KINDS)[number];
type Saved = { readonly step: Step; readonly answer: Partial<TripDraft>; readonly kind: TripKind };
const DRAFT_KEY = 'new_trip';

const isStep = (value: unknown): value is Step => STEPS.some((step) => step === value);
const isPlace = (value: unknown) => typeof asRecord(value)?.['id'] === 'string';

// The draft of an older version of the app is dropped when its step or its route does not fit.
function checkSaved(value: unknown): Saved | null {
  const saved = asRecord(value);
  const answer = asRecord(saved?.['answer']);
  if (!saved || !answer || !isStep(saved['step']) || !KINDS.some((kind) => kind === saved['kind'])) return null;
  const route = answer['route'];
  if (route !== undefined && !(isPlace(asRecord(route)?.['from']) && isPlace(asRecord(route)?.['to'])))
    return null;
  return saved as Saved;
}

// The answers of a new trip and its step, kept as a draft after every step and every typed letter
// of the comment (docs/94 F3, F8): «Назад» and a reopened app show each answer as it was.
// A trip from the empty day of the requests (G37, docs/101 R4) comes with its route and day.
export function useNewTrip(known: Route | undefined, day?: string, again?: TripAgain) {
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const start: Saved =
    known && again
      ? { step: 'when', answer: { route: known, ...again }, kind: 'again' }
      : {
          step: known ? 'mode' : 'route',
          answer: { ...(known ? { route: known } : {}), ...(day ? { date: day } : {}) },
          kind: 'new',
        };
  const { value, setValue, restored, clear } = useFlowDraft(
    DRAFT_KEY,
    checkSaved,
    start,
    known !== undefined || day !== undefined,
  );
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const go = (step: Step) => setValue((saved) => ({ ...saved, step }));
  const next = (passed: TripStep, patch: Partial<TripDraft>, step: Step) => {
    track({ name: 'trip_step', screen: `market.${passed}`, step: passed });
    setValue((saved) => ({ ...saved, step, answer: { ...saved.answer, ...patch } }));
  };
  const type = (comment: string) => setValue((saved) => ({ ...saved, answer: { ...saved.answer, comment } }));
  const startReturn = (published: TripDraft) =>
    setValue({ step: 'when', answer: returnDraft(published), kind: 'return' });
  useStepProgress(STEPS.indexOf(value.step), STEPS.length);
  const { route } = value.answer;
  useEffect(() => {
    if (!route) return;
    setRecommendation(null);
    market
      .recommend(route.from.id, route.to.id)
      .then(setRecommendation, () => setValue((saved) => ({ ...saved, step: 'route' })));
  }, [route, market, setValue]);
  return { ...value, recommendation, restored, clear, go, next, type, startReturn };
}
