import { tashkentDate } from '@platform/contracts';
import { dueSteps, type ReminderRules } from '../domain/reminder';
import type { AssignmentStore } from './ports';

// A driver application waiting for the team, as the drivers module gives it.
export type Waiting = {
  readonly userId: number;
  readonly publicId: string;
  readonly name: string;
  readonly submittedAt: number;
};

export type ReminderDeps = {
  readonly store: Pick<AssignmentStore, 'assigneeOf' | 'markReminder'>;
  readonly rules: ReminderRules;
  readonly now: () => number;
  readonly waiting: () => Promise<Waiting[]>;
  // The team now: a moderator removed or blocked since the assignment hears nothing (G89).
  readonly teamIds: () => Promise<number[]>;
  readonly toModerator: (moderatorId: number, application: Waiting) => Promise<void>;
  readonly toOwners: (application: Waiting, moderatorId: number) => Promise<void>;
};

// The Cron job (G34): the team answers within the hour. Each step goes once per sent application;
// a new sending of the same application starts its own reminders.
export async function remindWaiting(deps: ReminderDeps): Promise<void> {
  const now = deps.now();
  const team = await deps.teamIds();
  for (const application of await deps.waiting()) {
    const steps = dueSteps(application.submittedAt, now, deps.rules);
    if (steps.length === 0) continue;
    const day = tashkentDate(application.submittedAt);
    const moderatorId = await deps.store.assigneeOf('application', application.userId, day);
    if (moderatorId === undefined) continue;
    for (const step of steps) {
      if (!(await deps.store.markReminder(application.userId, application.submittedAt, step, now))) continue;
      if (step === 'owner') await deps.toOwners(application, moderatorId);
      else if (team.includes(moderatorId)) await deps.toModerator(moderatorId, application);
    }
  }
}
