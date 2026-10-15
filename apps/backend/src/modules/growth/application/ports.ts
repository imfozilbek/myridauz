import type { ShareMoment } from '@platform/contracts';

export type Side = 'passenger' | 'driver';

// A trip that is over and was ridden (docs/129): a passenger's seat or a seat in a driver's trip.
export type Ride = {
  readonly tripId: string;
  readonly seats: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
};

// The codes, the people they brought and the moments offered (G69, docs/123).
export type GrowthStore = {
  // The short code of the person, made at the first ask; never the id (docs/116).
  readonly codeOf: (userId: number) => Promise<string>;
  readonly impactOf: (userId: number) => Promise<{ readonly joined: number; readonly rode: number }>;
  readonly offered: (userId: number) => Promise<ShareMoment[]>;
  readonly offer: (userId: number, moments: readonly ShareMoment[], at: number) => Promise<void>;
  // When the team approved the driver; null: never.
  readonly approvedAt: (userId: number) => Promise<number | null>;
  // The seats ridden in a trip: the people in the car without the driver.
  readonly riders: (tripId: string) => Promise<number>;
};

// The ready message of a card for a chat: the text and the words of its buttons (docs/123).
export type CardMessage = {
  readonly text: string;
  readonly words: {
    readonly title: string;
    readonly button: string;
    readonly second?: { readonly text: string; readonly url: string };
  };
};

// The facts a chat message is made of: names, never ids (docs/123).
export type CardInput = {
  readonly moment: ShareMoment;
  readonly phrase: number;
  readonly name: string;
  // The names of the ends of the last trip; null: no trip yet.
  readonly route: { readonly from: string; readonly to: string } | null;
  readonly people: number;
  readonly joinLink: string;
};

export type GrowthDeps = {
  readonly store: GrowthStore;
  readonly rides: (userId: number, side: Side) => Promise<Ride[]>;
  readonly joinedAt: (userId: number) => Promise<number | undefined>;
  readonly passengerBot: string;
  readonly now: () => number;
};
