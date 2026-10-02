import type { Load } from '../domain/pick';

// A question of a person to the support bot, or the application of a driver (docs/92).
export type Kind = 'support' | 'application';

export type Assignment = {
  readonly kind: Kind;
  readonly subjectId: number;
  readonly day: string;
  readonly assigneeId: number;
  readonly at: number;
};

// The support questions of one team member on one day.
type SupportDone = { readonly assigneeId: number; readonly total: number; readonly answered: number };

export type AssignmentStore = {
  assigneeOf(kind: Kind, subjectId: number, day: string): Promise<number | undefined>;
  // The work of each member on this day, and when each got the last one.
  loads(day: string): Promise<Map<number, Load>>;
  save(assignment: Assignment): Promise<void>;
  // The latest question of this person, not answered yet, is answered now.
  answered(kind: Kind, subjectId: number, at: number): Promise<void>;
  supportOf(day: string): Promise<SupportDone[]>;
  // true once: the digest of this day is to be sent now.
  markDigest(day: string, at: number): Promise<boolean>;
};

export type AssignDeps = {
  readonly store: AssignmentStore;
  readonly teamIds: () => Promise<number[]>;
  readonly now: () => number;
};
