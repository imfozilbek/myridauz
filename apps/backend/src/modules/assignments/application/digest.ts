import { DAY_MS, tashkentDate, tashkentDayStart, tashkentTime } from '@platform/contracts';
import type { AssignDeps } from './ports';

// The digest waits for the new day in Tashkent and catches up a missed Cron tick until morning.
const DIGEST_UNTIL = '06:00';

// What one team member did on one day (docs/92).
export type DigestRow = {
  readonly memberId: number;
  readonly total: number;
  readonly answered: number;
  readonly applications: number;
};

export type DigestDeps = AssignDeps & {
  // Decisions on driver applications of each member in [from, to).
  readonly decisions: (from: number, to: number) => Promise<Map<number, number>>;
  readonly send: (day: string, rows: readonly DigestRow[]) => Promise<void>;
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

// The Cron job: after midnight in Tashkent the whole team gets the digest of the day before, once.
export async function sendDigest(deps: DigestDeps): Promise<void> {
  const now = deps.now();
  if (tashkentTime(now) >= DIGEST_UNTIL) return;
  const day = tashkentDate(now - DAY_MS);
  if (!(await deps.store.markDigest(day, now))) return;
  await deps.send(day, await digestOf(deps, day));
}
