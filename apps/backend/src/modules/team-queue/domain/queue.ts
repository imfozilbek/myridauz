import { MINUTE_MS, teamWaitMs, type TeamHours } from '@platform/contracts';

// The work of the team in one queue (docs/120, docs/122): driver applications, complaints, face photos.
type CaseKind = 'application' | 'complaint' | 'face';

export type Case = {
  readonly kind: CaseKind;
  // Whom the case is about: the driver, the author of a complaint, the person of a photo.
  readonly name: string;
  readonly since: number;
};

export type Queue = {
  readonly counts: Readonly<Record<CaseKind, number>>;
  readonly total: number;
  // The case that waits longest, in team minutes: the night does not count (G34).
  readonly oldest: { readonly item: Case; readonly minutes: number } | null;
};

export function queueOf(cases: readonly Case[], now: number, hours: TeamHours): Queue {
  const counts = { application: 0, complaint: 0, face: 0 };
  for (const item of cases) counts[item.kind] += 1;
  let oldest: Queue['oldest'] = null;
  for (const item of cases) {
    const minutes = Math.floor(teamWaitMs(item.since, now, hours) / MINUTE_MS);
    if (!oldest || minutes > oldest.minutes) oldest = { item, minutes };
  }
  return { counts, total: cases.length, oldest };
}
