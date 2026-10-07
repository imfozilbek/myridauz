import type { TripDraft } from './trip-draft';

// "Qaytish safari" (docs/40, question 43): the route the other way, the same seats, price and
// "ayol bor" and the rule of the whole car (G61); only the date and the time are chosen again.
export function returnDraft(draft: TripDraft): Partial<TripDraft> {
  const { route, seats, price, womanOnBoard, pickupMode, bookingRule } = draft;
  const back = { from: route.to, to: route.from };
  return { route: back, pickupMode, seats, price, womanOnBoard, bookingRule, comment: '' };
}
