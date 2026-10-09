import { MINUTE_MS, teamWaitMs, type NavbatItem, type NavbatKind, type TeamHours } from '@platform/contracts';

// The work of the team in one queue (docs/120, docs/122): driver applications, complaints, face
// photos and support questions (G75). The bot card counts it, the admin app lists it.
type Computed = 'minutes' | 'late' | 'takenBy';
export type Case = NavbatItem extends infer Item
  ? Item extends NavbatItem
    ? Omit<Item, Computed>
    : never
  : never;

export type Queue = {
  readonly counts: Readonly<Record<NavbatKind, number>>;
  readonly total: number;
  // The case that waits longest, in team minutes: the night does not count (G34).
  readonly oldest: { readonly item: Case; readonly minutes: number } | null;
};

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
