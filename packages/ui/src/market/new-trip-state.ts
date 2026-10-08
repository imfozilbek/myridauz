import { useEffect, useRef } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import type { Route } from '../places/route-screen';
import { useRouteFacts } from './route-facts';
import type { TripAgain, TripDraft } from './trip-draft';

// The one screen of a new trip and what it opens and comes back from (G63, docs/118 path 6): the
// route at first or one end of it, the day and time, the rule, the comment, the pitak on the map.
const SCREENS = ['route', 'from', 'to', 'form', 'when', 'rule', 'comment', 'pitak'] as const;
export type TripScreen = (typeof SCREENS)[number];
export type TripAnswer = Partial<TripDraft>;
type Saved = { readonly screen: TripScreen; readonly answer: TripAnswer };
const DRAFT_KEY = 'new_trip';

// Another route has its own price and pitak: both are taken anew (docs/09, docs/72).
const ROUTE_BOUND = new Set(['price', 'pickupMode']);
const offRoute = (answer: TripAnswer) =>
  Object.fromEntries(Object.entries(answer).filter(([key]) => !ROUTE_BOUND.has(key))) as TripAnswer;

const isScreen = (value: unknown): value is TripScreen => SCREENS.some((screen) => screen === value);
const isPlace = (value: unknown) => typeof asRecord(value)?.['id'] === 'string';

// The draft of an older version of the app is dropped when its screen or its route does not fit.
function checkSaved(value: unknown): Saved | null {
  const saved = asRecord(value);
  const answer = asRecord(saved?.['answer']);
  if (!saved || !answer || !isScreen(saved['screen'])) return null;
  const route = answer['route'];
  if (route !== undefined && !(isPlace(asRecord(route)?.['from']) && isPlace(asRecord(route)?.['to'])))
    return null;
  return saved as Saved;
}

// The answers of a new trip and the screen open, kept as a draft after every change and every typed
// letter of the comment (docs/94 F3, F8). A trip from the empty day of the requests (G37, docs/101
// R4) comes with its route and day, «Oxirgi yoʻnalish» with the answers of the last trip (G40 K3).
export function useNewTrip(known: Route | undefined, day?: string, again?: TripAgain) {
  const { track } = useAnalytics();
  const answer: TripAnswer = { ...(known ? { route: known } : {}), ...(day ? { date: day } : {}), ...again };
  const start: Saved = { screen: known ? 'form' : 'route', answer };
  const { value, setValue, restored, clear } = useFlowDraft(
    DRAFT_KEY,
    checkSaved,
    start,
    Boolean(known ?? day),
  );
  const open = (screen: TripScreen) => setValue((saved) => ({ ...saved, screen }));
  // A change stays where it is made: a switch of the screen, a letter of the comment.
  const change = (patch: TripAnswer) =>
    setValue((saved) => ({ ...saved, answer: { ...saved.answer, ...patch } }));
  // A screen of its own comes back to the one screen with its answer.
  const back = (patch: TripAnswer = {}) =>
    setValue((saved) => ({ screen: 'form', answer: { ...saved.answer, ...patch } }));
  const reroute = (next: Route) =>
    setValue((saved) => ({ screen: 'form', answer: { ...offRoute(saved.answer), route: next } }));
  const { route } = value.answer;
  // The route is on the screen once a flow: the first step of the funnel (docs/29).
  const tracked = useRef(false);
  useEffect(() => {
    if (!route || tracked.current) return;
    tracked.current = true;
    track({ name: 'trip_step', screen: 'market.publish', step: 'route' });
  }, [route, track]);
  const { recommendation, pitak } = useRouteFacts(route, () => open('route'));
  return { ...value, recommendation, pitak, restored, clear, open, change, back, reroute };
}
