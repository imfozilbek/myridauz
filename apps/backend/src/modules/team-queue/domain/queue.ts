import { MINUTE_MS, teamWaitMs, type NavbatItem, type NavbatKind, type TeamHours } from '@platform/contracts';

// The work of the team in one queue (docs/120, docs/122): driver applications, complaints, face
// photos and support questions (G75). The bot card counts it, the admin app lists it.
type Computed = 'minutes' | 'late' | 'takenBy';
// sides: the people a complaint is about, its author and the one it is against; they stay on the
// server (Telegram ids), the admin app never reads them.
export type Case = (NavbatItem extends infer Item
  ? Item extends NavbatItem
    ? Omit<Item, Computed>
    : never
  : never) & {
  readonly sides?: readonly number[];
};

export type Queue = {
  readonly counts: Readonly<Record<NavbatKind, number>>;
  readonly total: number;
  // The case that waits longest, in team minutes: the night does not count (G34).
  readonly oldest: { readonly item: Case; readonly minutes: number } | null;
};

// A refund of a no-show waits for the owner (docs/35, G75): it is not the work of the whole team.
const ownersOnly = (item: Case) => item.kind === 'complaint' && item.refund;
export const teamWork = (cases: readonly Case[]): Case[] => cases.filter((item) => !ownersOnly(item));

// The work of one member: the owner all of it; a moderator the work of the team without a complaint
// about themselves, which only the owner decides (G89, G91 ADM-3).
export const workOf = (cases: readonly Case[], memberId: number, owner: boolean): Case[] =>
  owner ? [...cases] : teamWork(cases).filter((item) => !item.sides?.includes(memberId));

// A case as the admin app reads it: without its sides.
export function shownCase(item: Case): Case {
  const shown: Case & { sides?: readonly number[] } = { ...item };
  delete shown.sides;
  return shown;
}

export const waitedMinutes = (item: Case, now: number, hours: TeamHours) =>
  Math.floor(teamWaitMs(item.since, now, hours) / MINUTE_MS);

export function queueOf(cases: readonly Case[], now: number, hours: TeamHours): Queue {
  const counts = { application: 0, complaint: 0, face: 0, support: 0 };
  for (const item of cases) counts[item.kind] += 1;
  let oldest: Queue['oldest'] = null;
  for (const item of cases) {
    const minutes = waitedMinutes(item, now, hours);
    if (!oldest || minutes > oldest.minutes) oldest = { item, minutes };
  }
  return { counts, total: cases.length, oldest };
}
