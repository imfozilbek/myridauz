import { DAY_MS } from '@platform/contracts';

// One message of the support talk (G32): the person's, or the team's as «Operator N».
export type HistoryEntry = {
  readonly personId: number;
  readonly at: number;
  readonly author: 'person' | 'team';
  // The person's first name, or «Operator N» for the team: the team member is never named.
  readonly name: string;
  readonly kind: 'text' | 'voice' | 'photo';
  readonly text: string;
};

export type SupportHistory = {
  add(entry: HistoryEntry): Promise<void>;
  // Oldest first.
  of(personId: number): Promise<HistoryEntry[]>;
  forget(personId: number): Promise<void>;
  purge(before: number): Promise<void>;
};

// The talk is kept 90 days (owner's decision 02.10.2026, docs/30).
export const KEEP_MS = 90 * DAY_MS;
