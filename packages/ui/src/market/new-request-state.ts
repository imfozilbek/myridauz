import type { PickupMode, Pitak, Recommendation } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import { useStepProgress } from '../flow/step-progress';
import type { Route } from '../places/route-screen';
import type { RememberedWay } from '../way/remembered-way';
import { regionOf, type WayEnd } from '../way/way-end';

const STEPS = ['route', 'date', 'mode', 'pickup', 'dropoff', 'price', 'review'] as const;
export type RequestStepName = (typeof STEPS)[number];
export type RequestAnswer = {
  readonly route?: Route;
  readonly date?: string;
  readonly mode?: PickupMode;
  readonly pickup?: WayEnd | null;
  readonly dropoff?: WayEnd;
  readonly seats?: number;
  readonly price?: number;
};
type Saved = { readonly step: RequestStepName; readonly answer: RequestAnswer; readonly editing?: boolean };
const DRAFT_KEY = 'new_request';

const isStep = (value: unknown): value is RequestStepName => STEPS.some((step) => step === value);
const hasId = (place: unknown) => typeof asRecord(place)?.['id'] === 'string';
const hasPlace = (end: unknown) => end === undefined || end === null || hasId(asRecord(end)?.['place']);

// The draft of an older version of the app is dropped when its step or its places do not fit.
function checkSaved(value: unknown): Saved | null {
  const saved = asRecord(value);
  const answer = asRecord(saved?.['answer']);
  if (!saved || !answer || !isStep(saved['step'])) return null;
  const route = asRecord(answer['route']);
  if (answer['route'] !== undefined && !(hasId(route?.['from']) && hasId(route?.['to']))) return null;
  return hasPlace(answer['pickup']) && hasPlace(answer['dropoff']) ? (saved as Saved) : null;
}

// The first step without an answer; with all of them, the check.
const nextStep = (answer: RequestAnswer): RequestStepName => {
  const { route, date, mode, pickup, dropoff, price } = answer;
  if (!route) return 'route';
  if (!date) return 'date';
  if (!mode) return 'mode';
  if (mode !== 'pitak' && !pickup) return 'pickup';
  return !dropoff ? 'dropoff' : !price ? 'price' : 'review';
};

// The answers of a request and its step, kept as a draft after every step (docs/94 F3, F8). From
// an empty day of the search (G35, docs/97 K6) the route and the day come with it, and the way
// of the last trip on the route too: the price and the check are left.
export function useNewRequest(
  search: { route: Route; date: string } | undefined,
  last: RememberedWay | null,
) {
  const { market, map } = useApiClients();
  const kept = last ? { mode: last.mode, pickup: last.pickup, dropoff: last.dropoff } : {};
  const answer: RequestAnswer = search ? { ...search, ...kept } : {};
  const start: Saved = { step: nextStep(answer), answer };
  const { value, setValue, restored, clear } = useFlowDraft(DRAFT_KEY, checkSaved, start, Boolean(search));
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [pitak, setPitak] = useState<Pitak | null | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const go = (step: RequestStepName, editing = false) => setValue((saved) => ({ ...saved, step, editing }));
  const next = (patch: RequestAnswer) =>
    setValue((saved) => {
      const changed = { ...saved.answer, ...patch };
      return { step: nextStep(changed), answer: changed };
    });
  const done = () => {
    clear();
    setSent(true);
  };
  useStepProgress(sent ? -1 : STEPS.indexOf(value.step), STEPS.length);
  const { route } = value.answer;
  useEffect(() => {
    if (!route) return;
    setRecommendation(null);
    setPitak(undefined);
    market.recommend(route.from.id, route.to.id).then(setRecommendation, () => go('route'));
    // A pitak joins two regions (docs/72): without it the passenger is taken at the door.
    map.pitakOf(regionOf(route.from), regionOf(route.to)).then(setPitak, () => setPitak(null));
  }, [route, market, map]);
  return { ...value, editing: value.editing ?? false, recommendation, pitak, restored, sent, done, go, next };
}
