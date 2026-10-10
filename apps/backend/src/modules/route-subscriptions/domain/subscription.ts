import { DAY_MS, tashkentDayStart, type SubscriptionInput, type SubscriptionKind } from '@platform/contracts';

// A route subscription (docs/24): a passenger waits for trips, a driver for requests.
export type SubscriptionRecord = SubscriptionInput & {
  readonly id: string;
  readonly userId: number;
  readonly kind: SubscriptionKind;
  readonly expiresAt: number;
  // "Any date" that is over: the renewal was offered, it waits to be renewed or deleted.
  readonly expired: boolean;
  readonly createdAt: number;
};

// A trip or a request as a subscription sees it.
export type Match = {
  readonly id: string;
  readonly ownerId: number;
  readonly from: string;
  readonly to: string;
  // The day in Tashkent.
  readonly date: string;
  readonly woman: boolean;
  // For the news card: who, the time of a trip (a request has only a day), seats and the price of
  // one; a request may want the whole car (G68, mockup g68/3).
  readonly name: string;
  readonly time: string | null;
  readonly seats: number;
  readonly price: number;
  readonly wholeCar: boolean;
};

// A dated subscription lives to the end of its day, "any date" the brand's days (docs/24).
export const expiresAtOf = (date: string | null, now: number, anyDateDays: number) =>
  date === null ? now + anyDateDays * DAY_MS : tashkentDayStart(date) + DAY_MS;

export const isActive = (subscription: SubscriptionRecord, now: number) =>
  !subscription.expired && subscription.expiresAt > now;

type PlaceMatch = (placeId: string, searchId: string) => boolean;

// Does a new trip or request fit the subscription? Not one's own, the same route (a region stands
// for all its places, docs/14), the day, and "Mashinada ayol bor" when asked (docs/06).
export function fits(subscription: SubscriptionRecord, match: Match, placeMatches: PlaceMatch): boolean {
  if (match.ownerId === subscription.userId) return false;
  if (!placeMatches(match.from, subscription.from) || !placeMatches(match.to, subscription.to)) return false;
  if (subscription.date !== null && subscription.date !== match.date) return false;
  return !subscription.woman || match.woman;
}
