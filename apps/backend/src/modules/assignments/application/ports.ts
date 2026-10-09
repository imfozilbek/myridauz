import type { Load } from '../domain/pick';
import type { ReminderStep } from '../domain/reminder';

// A question of a person to the support bot, or the application of a driver (docs/92).
export type Kind = 'support' | 'application';

export type Assignment = {
  readonly kind: Kind;
  readonly subjectId: number;
  readonly day: string;
  readonly assigneeId: number;
  readonly at: number;
  // «Operator N» the person sees in the answers of this question.
  readonly operator: number;
};

// The support questions of one team member on one day.
type SupportDone = { readonly assigneeId: number; readonly total: number; readonly answered: number };

export type AssignmentStore = {
  assigneeOf(kind: Kind, subjectId: number, day: string): Promise<number | undefined>;
  // The work of each member on this day, and when each got the last one.
  loads(day: string): Promise<Map<number, Load>>;
  save(assignment: Assignment): Promise<void>;
  // The operator number of the latest question of this person.
  operatorOf(kind: Kind, subjectId: number): Promise<number | undefined>;
  // The latest question of this person, not answered yet, is answered now.
  answered(kind: Kind, subjectId: number, at: number): Promise<void>;
  supportOf(day: string): Promise<SupportDone[]>;
  // The support questions from this day on not answered yet: cases of «Navbat» (G75).
  openSupport(fromDay: string): Promise<{ readonly subjectId: number; readonly at: number }[]>;
  // true once: the digest of this day is to be sent now.
  markDigest(day: string, at: number): Promise<boolean>;
  // true once: this reminder of the application sent at submittedAt is to be sent now (G34).
  markReminder(userId: number, submittedAt: number, step: ReminderStep, at: number): Promise<boolean>;
};

export type AssignDeps = {
  readonly store: AssignmentStore;
  readonly teamIds: () => Promise<number[]>;
  readonly now: () => number;
  readonly random: () => number;
};
