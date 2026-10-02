import { isTeamTime, MINUTE_MS, teamWaitMs, type TeamHours } from '@platform/contracts';

// Who hears about an application the team has not checked (G34): first its moderator, then the owners.
export type ReminderStep = 'moderator' | 'owner';

export type ReminderRules = {
  readonly hours: TeamHours;
  readonly remindMinutes: number;
  readonly ownerMinutes: number;
};

// The steps due now for an application sent at submittedAt. Only team time counts, and outside
// team hours nobody is woken up: the night waits for the morning.
export function dueSteps(submittedAt: number, now: number, rules: ReminderRules): ReminderStep[] {
  if (!isTeamTime(now, rules.hours)) return [];
  const waited = teamWaitMs(submittedAt, now, rules.hours);
  const steps: ReminderStep[] = [];
  if (waited >= rules.remindMinutes * MINUTE_MS) steps.push('moderator');
  if (waited >= rules.ownerMinutes * MINUTE_MS) steps.push('owner');
  return steps;
}
