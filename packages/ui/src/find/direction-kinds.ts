import type { MarketClient } from '@platform/api-client';
import type { DirectionCard } from '@platform/contracts';
import type { I18n, TranslationKey } from '@platform/i18n';
import { requestsOf, tripsOf } from './trips-of';

// One «Qayerga» for both roles (owner decision 12.11.2026, docs/118): the same screen and order of
// regions; a passenger sees the trips of each direction, a driver the requests of passengers.
export type DirectionKind = {
  readonly screen: string;
  readonly title: TranslationKey;
  // The key the cards are kept under while the app is open.
  readonly memory: string;
  readonly cards: (market: MarketClient, from: string) => Promise<DirectionCard[]>;
  readonly hint: (t: I18n['t'], card: DirectionCard) => string | null;
};

export const TRIP_DIRECTIONS: DirectionKind = {
  screen: 'market.directions',
  title: 'find.title',
  memory: 'directions',
  cards: (market, from) => market.directions(from),
  hint: tripsOf,
};

export const REQUEST_DIRECTIONS: DirectionKind = {
  screen: 'market.requestDirections',
  title: 'home.dock.toDriver',
  memory: 'requestDirections',
  cards: (market, from) => market.requestDirections(from),
  hint: requestsOf,
};
