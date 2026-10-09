import type { NavbatKind } from '@platform/contracts';

// A member opened a case of «Navbat» (G75): the last opening of each case.
export type Take = { readonly kind: NavbatKind; readonly id: string; readonly memberId: number };

export type TakeStore = {
  readonly take: (take: Take, at: number) => Promise<void>;
  // The cases opened since this moment.
  readonly fresh: (since: number) => Promise<Take[]>;
};
