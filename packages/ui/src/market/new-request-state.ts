import { useState } from 'react';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import { useStepProgress } from '../flow/step-progress';
import type { Route } from '../places/route-screen';
import type { RememberedWay } from '../way/remembered-way';
import type { WayEnd } from '../way/way-end';
import { useRouteFacts } from './route-facts';

// The route and the day, then «Qayerdan, qayerga?» with the maps of its two ends (G61, docs/118 path 4).
const STEPS = ['route', 'date', 'points', 'pickup', 'dropoff'] as const;
type RequestStepName = (typeof STEPS)[number];
export type RequestAnswer = {
  readonly route?: Route;
  readonly date?: string;
  // The start at the door or at the pitak of the direction (docs/70); none until chosen.
  readonly mode?: 'door' | 'pitak';
  readonly pickup?: WayEnd | null;
  readonly dropoff?: WayEnd;
  readonly seats?: number;
  readonly price?: number;
  readonly withWoman?: boolean;
  readonly wholeCar?: boolean;
};
type Saved = { readonly step: RequestStepName; readonly answer: RequestAnswer };
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

// The first step without an answer; with the route and the day, the one screen of the request.
const nextStep = ({ route, date }: RequestAnswer): RequestStepName =>
  !route ? 'route' : !date ? 'date' : 'points';

// The way of the last trip on a route (G35, docs/97 K4): a request starts at the door or at the pitak.
export const keptWay = (last: RememberedWay | null): RequestAnswer =>
  last && last.mode !== 'both' ? { mode: last.mode, pickup: last.pickup, dropoff: last.dropoff } : {};

// The answers of a request and its step, kept as a draft after every step (docs/94 F3, F8). From
// an empty day of the search (G35, docs/97 K6) the route and the day come with it, and the way
// of the last trip on the route too: only the people and the price are left.
export function useNewRequest(
  search: { route: Route; date: string } | undefined,
  last: RememberedWay | null,
) {
  const answer: RequestAnswer = search ? { ...search, ...keptWay(last) } : {};
  const start: Saved = { step: nextStep(answer), answer };
  const { value, setValue, restored, clear } = useFlowDraft(DRAFT_KEY, checkSaved, start, Boolean(search));
  const [sent, setSent] = useState(false);
  const go = (step: RequestStepName) => setValue((saved) => ({ ...saved, step }));
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
  const { recommendation, pitak } = useRouteFacts(value.answer.route, () => go('route'));
  return { ...value, recommendation, pitak, restored, sent, done, go, next };
}
