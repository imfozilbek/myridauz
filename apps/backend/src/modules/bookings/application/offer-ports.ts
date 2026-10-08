import type { OfferRecord } from '../domain/offer';
import type { TalkRecord } from '../domain/talk';

export type OfferRepository = {
  save(offer: OfferRecord): Promise<void>;
  // Saves only if the offer still has the expected status: an offer is accepted once (docs/65 A4).
  replace(offer: OfferRecord, expected: OfferRecord['status']): Promise<boolean>;
  find(id: string): Promise<OfferRecord | undefined>;
  byRequests(requestIds: readonly string[]): Promise<OfferRecord[]>;
  byDriver(driverId: number): Promise<OfferRecord[]>;
};

// The talks about requests (G64): one per request and driver.
export type TalkRepository = {
  // The talk of this pair, made now if there is none: two taps at once still make one (unique pair).
  open(talk: TalkRecord): Promise<TalkRecord>;
  find(id: string): Promise<TalkRecord | undefined>;
  byDriver(driverId: number): Promise<TalkRecord[]>;
  byRequests(requestIds: readonly string[]): Promise<TalkRecord[]>;
};
