import type { LimitKey } from '@platform/contracts';

// A change of a limit by the owner (docs/128 §4): who, when, before, after.
export type LimitChange = {
  readonly key: LimitKey;
  readonly before: number;
  readonly after: number;
  readonly by: number;
  readonly at: number;
};

export type LimitStore = {
  values(): Promise<Map<LimitKey, number>>;
  // The value and its line of history, in one step.
  change(change: LimitChange): Promise<void>;
  // The newest first.
  history(limit: number): Promise<LimitChange[]>;
};
