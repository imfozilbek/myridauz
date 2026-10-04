import type { SubscriptionKind } from '@platform/contracts';
import type { Match, SubscriptionRecord } from '../domain/subscription';

export type SubscriptionRepository = {
  save(subscription: SubscriptionRecord): Promise<void>;
  find(id: string): Promise<SubscriptionRecord | undefined>;
  remove(id: string): Promise<void>;
  byUser(userId: number, kind: SubscriptionKind): Promise<SubscriptionRecord[]>;
  // Not expired yet: the ones a new trip or request is matched against.
  live(kind: SubscriptionKind, now: number): Promise<SubscriptionRecord[]>;
  // The Cron job: matches waiting, and "any date" ones over but not offered to renew yet.
  waiting(): Promise<SubscriptionRecord[]>;
  overdue(now: number): Promise<SubscriptionRecord[]>;
};

// What the bots say (docs/24): one match, several at once, the offer to renew, a cheaper trip (G39).
export type SubscriptionTeller = {
  one(subscription: SubscriptionRecord, match: Match): Promise<void>;
  many(subscription: SubscriptionRecord, count: number): Promise<void>;
  renew(subscription: SubscriptionRecord): Promise<void>;
  cheaper(subscription: SubscriptionRecord, match: Match): Promise<void>;
};

export type SubscriptionsDeps = {
  readonly subscriptions: SubscriptionRepository;
  readonly placeMatches: () => Promise<(placeId: string, searchId: string) => boolean>;
  readonly tell: SubscriptionTeller;
  readonly newId: () => string;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
