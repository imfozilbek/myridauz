import type { AttentionSign } from '@platform/contracts';

// A sign of «Diqqat» as it is kept (G75, docs/120): its id edits the line of the day.
export type KeptSign = { readonly id: string; readonly at: number; readonly sign: AttentionSign };

// The signs of a Tashkent day, newest first; a sign of the same id the same day replaces its row.
export type SignStore = {
  readonly keep: (day: string, kept: KeptSign) => Promise<void>;
  readonly ofDay: (day: string) => Promise<KeptSign[]>;
};
