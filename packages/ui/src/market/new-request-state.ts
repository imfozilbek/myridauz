import type { Recommendation } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import { useStepProgress } from '../flow/step-progress';
import type { Way } from '../way/way-end';

const STEPS = ['route', 'date', 'seats', 'price', 'review'] as const;
type Step = (typeof STEPS)[number];
type Answer = {
  readonly way?: Way;
  readonly date?: string;
  readonly seats?: number;
  readonly price?: number;
};
type Saved = { readonly step: Step; readonly answer: Answer };
const DRAFT_KEY = 'new_request';

const isStep = (value: unknown): value is Step => STEPS.some((step) => step === value);
const hasPlace = (end: unknown) => typeof asRecord(asRecord(end)?.['place'])?.['id'] === 'string';

// The draft of an older version of the app is dropped when its step or its way does not fit.
function checkSaved(value: unknown): Saved | null {
  const saved = asRecord(value);
  const answer = asRecord(saved?.['answer']);
  if (!saved || !answer || !isStep(saved['step'])) return null;
  const way = asRecord(answer['way']);
  if (answer['way'] !== undefined && !(hasPlace(way?.['from']) && hasPlace(way?.['to']))) return null;
  return saved as Saved;
}

// The answers of a request and its step, kept as a draft after every step (docs/94 F3, F8):
// «Назад» and a reopened app show each answer as it was; sent, the draft is gone.
export function useNewRequest() {
  const { market } = useApiClients();
  const start: Saved = { step: 'route', answer: {} };
  const { value, setValue, restored, clear } = useFlowDraft(DRAFT_KEY, checkSaved, start);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [sent, setSent] = useState(false);
  const go = (step: Step) => setValue((saved) => ({ ...saved, step }));
  const next = (patch: Answer, step: Step) =>
    setValue((saved) => ({ step, answer: { ...saved.answer, ...patch } }));
  const done = () => {
    clear();
    setSent(true);
  };
  useStepProgress(sent ? -1 : STEPS.indexOf(value.step), STEPS.length);
  const { way } = value.answer;
  useEffect(() => {
    if (!way) return;
    setRecommendation(null);
    market
      .recommend(way.from.place.id, way.to.place.id)
      .then(setRecommendation, () => setValue((saved) => ({ ...saved, step: 'route' })));
  }, [way, market, setValue]);
  return { ...value, recommendation, restored, sent, done, go, next };
}
