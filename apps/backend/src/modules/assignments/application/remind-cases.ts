import type { NavbatKind } from '@platform/contracts';
import { dueSteps, type ReminderRules, type ReminderStep } from '../domain/reminder';

// A case of «Navbat» other than a driver application (G89 A5): a complaint, a photo or a support
// question, as the queue shows it.
export type WaitingCase = {
  readonly kind: Exclude<NavbatKind, 'application'>;
  readonly id: string;
  readonly name: string;
  readonly since: number;
};

export type CaseReminderDeps = {
  readonly rules: ReminderRules;
  readonly now: () => number;
  readonly cases: () => Promise<WaitingCase[]>;
  // The member who has the case: a support question has one, a complaint and a photo none.
  readonly assigneeOf: (item: WaitingCase) => Promise<number | undefined>;
  readonly teamIds: () => Promise<number[]>;
  // true once: this step of the case waiting since `since` is to be sent now.
  readonly mark: (item: WaitingCase, step: ReminderStep, at: number) => Promise<boolean>;
  readonly toMembers: (memberIds: readonly number[], item: WaitingCase) => Promise<void>;
  readonly toOwners: (item: WaitingCase, moderatorId: number | undefined) => Promise<void>;
};

// The Cron job (owner decision 20.10.2026, G89 A5): every case rings as an application does (G34):
// its member at 25 team minutes, the owners at 30, once per case and step. A case nobody has, or
// whose member left the team, rings the whole team.
export async function remindCases(deps: CaseReminderDeps): Promise<void> {
  const now = deps.now();
  const team = await deps.teamIds();
  for (const item of await deps.cases()) {
    const steps = dueSteps(item.since, now, deps.rules);
    if (steps.length === 0) continue;
    const assignee = await deps.assigneeOf(item);
    const own = assignee !== undefined && team.includes(assignee);
    for (const step of steps) {
      if (!(await deps.mark(item, step, now))) continue;
      if (step === 'owner') await deps.toOwners(item, own ? assignee : undefined);
      else await deps.toMembers(own ? [assignee] : team, item);
    }
  }
}
