import { DAY_MS, tashkentDate, tashkentDayStart, tashkentTime } from '@platform/contracts';
import type { AssignDeps } from './ports';

// The summary of the day goes to the owner at 21:00 Tashkent (owner decision 06.10.2026, docs/122),
// instead of the digest after midnight; a missed Cron tick is caught up until midnight.
const SUMMARY_FROM = '21:00';

// What one team member did on one day (docs/92).
export type DigestRow = {
  readonly memberId: number;
  readonly total: number;
  readonly answered: number;
  readonly applications: number;
};

// The numbers of the day from the dashboard (docs/29): new people, trips, bookings, from channels.
export type DayNumbers = {
  readonly newUsers: number;
  readonly trips: number;
  readonly bookings: number;
  readonly fromChannels: number;
};

export type DigestDeps = AssignDeps & {
  // Decisions on driver applications of each member in [from, to).
  readonly decisions: (from: number, to: number) => Promise<Map<number, number>>;
  readonly numbers: (since: number) => Promise<DayNumbers>;
  readonly send: (day: string, rows: readonly DigestRow[], numbers: DayNumbers) => Promise<void>;
};

// Every member of the team, and anyone who worked that day and left since.
async function digestOf(deps: DigestDeps, day: string): Promise<DigestRow[]> {
  const from = tashkentDayStart(day);
  const support = await deps.store.supportOf(day);
  const decisions = await deps.decisions(from, from + DAY_MS);
  const ids = new Set([
    ...(await deps.teamIds()),
    ...support.map((row) => row.assigneeId),
    ...decisions.keys(),
  ]);
  return [...ids].map((memberId) => {
    const done = support.find((row) => row.assigneeId === memberId);
    return {
      memberId,
      total: done?.total ?? 0,
      answered: done?.answered ?? 0,
      applications: decisions.get(memberId) ?? 0,
    };
  });
}

// The Cron job: at 21:00 in Tashkent the owner gets the summary of the day, once.
export async function sendDigest(deps: DigestDeps): Promise<void> {
  const now = deps.now();
  if (tashkentTime(now) < SUMMARY_FROM) return;
  const day = tashkentDate(now);
  if (!(await deps.store.markDigest(day, now))) return;
  const [rows, numbers] = await Promise.all([digestOf(deps, day), deps.numbers(tashkentDayStart(day))]);
  await deps.send(day, rows, numbers);
}
