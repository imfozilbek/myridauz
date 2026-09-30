import type { TripDraft } from './new-trip-flow';

// "Qaytish safari" (docs/40, question 43): the route the other way, the same seats, price and
// "ayol bor"; only the date and the time are chosen again.
export function returnDraft(draft: TripDraft): Partial<TripDraft> {
  const { route, seats, price, womanOnBoard } = draft;
  return { route: { from: route.to, to: route.from }, seats, price, womanOnBoard, comment: '' };
}
