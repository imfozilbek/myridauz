import type { ShareMoment } from '@platform/contracts';

export type Side = 'passenger' | 'driver';

// The codes, the people they brought and the moments offered (G69, docs/123).
export type GrowthStore = {
  // The short code of the person, made at the first ask; never the id (docs/116).
  readonly codeOf: (userId: number) => Promise<string>;
  readonly impactOf: (userId: number) => Promise<{ readonly joined: number; readonly rode: number }>;
  readonly offered: (userId: number) => Promise<ShareMoment[]>;
  readonly offer: (userId: number, moment: ShareMoment, at: number) => Promise<void>;
  // When the team approved the driver; null: never.
  readonly approvedAt: (userId: number) => Promise<number | null>;
};

// The ready message of a card for a chat: the text and the words of its button (docs/123); photo:
// the public link of a picture above the text (the driver's trip, G88).
export type CardMessage = {
  readonly text: string;
  readonly words: { readonly title: string; readonly button: string };
  readonly photo?: string;
};

// The facts a chat message is made of: the name, never the id (docs/123).
export type CardInput = {
  readonly moment: ShareMoment;
  readonly phrase: number;
  readonly name: string;
};

export type GrowthDeps = {
  readonly store: GrowthStore;
  readonly passengerBot: string;
  readonly now: () => number;
};
