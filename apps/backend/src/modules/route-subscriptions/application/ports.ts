import type { SubscriptionKind } from '@platform/contracts';
import type { Match, SubscriptionRecord } from '../domain/subscription';

export type SubscriptionRepository = {
  save(subscription: SubscriptionRecord): Promise<void>;
  find(id: string): Promise<SubscriptionRecord | undefined>;
  remove(id: string): Promise<void>;
  byUser(userId: number, kind: SubscriptionKind): Promise<SubscriptionRecord[]>;
  // Not expired yet: the ones a new trip or request is matched against.
  live(kind: SubscriptionKind, now: number): Promise<SubscriptionRecord[]>;
  // The Cron job: the ones whose time is over, "any date" ones not offered to renew yet.
  overdue(now: number): Promise<SubscriptionRecord[]>;
};

// What the bots say in the news card of the route (docs/24, docs/122 rule 4): a new trip or
// request, a cheaper trip (G39), the offer to renew.
export type SubscriptionTeller = {
  one(subscription: SubscriptionRecord, match: Match): Promise<void>;
  renew(subscription: SubscriptionRecord): Promise<void>;
  cheaper(subscription: SubscriptionRecord, match: Match): Promise<void>;
};

export type SubscriptionsDeps = {
  readonly subscriptions: SubscriptionRepository;
  readonly placeMatches: () => Promise<(placeId: string, searchId: string) => boolean>;
  readonly tell: SubscriptionTeller;
  // At most max live ones; one for any date lives anyDateDays (brand, docs/128 §4).
  readonly limits: { readonly max: number; readonly anyDateDays: number };
  readonly newId: () => string;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
