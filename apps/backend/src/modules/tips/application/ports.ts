import type { TipStep } from '@platform/contracts';
import type { Tip, TipBot } from '../domain/tip-rules';
import type { Window } from '../domain/tip-windows';

// A person stopped on a step; target: what the button opens (a trip, a request, a route of a day).
export type Stopped = { readonly userId: number; readonly step: TipStep; readonly target?: string };
// The tip ready to go; bonus: the bonus left in «Hamyon» of an approved driver (D2).
export type ReadyTip = Stopped & { readonly bonus?: number };

// What a run of the tips needs (D1 in production).
export type TipsDeps = {
  // The people who stopped on a step in a window, a bounded batch, read by indexes (docs/117).
  stopped(step: TipStep, window: Window, now: number): Promise<Stopped[]>;
  // Of these, the people the bot may write: not deleted, not blocked, the bot not stopped.
  reachable(ids: readonly number[], bot: TipBot): Promise<ReadonlySet<number>>;
  // The drivers and the passengers on the road now: no tip during a trip.
  onTheRoad(now: number): Promise<ReadonlySet<number>>;
  // The tips these people already had.
  journal(ids: readonly number[]): Promise<Tip[]>;
  record(tips: readonly Tip[]): Promise<void>;
  bonus(driverId: number): Promise<number>;
  send(tips: readonly ReadyTip[]): Promise<void>;
  now(): number;
};
