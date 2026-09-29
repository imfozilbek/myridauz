import {
  COMPLAINT_WINDOW_DAYS,
  DAY_MS,
  HIDE_AFTER_COMPLAINTS,
  HIGH_PRIORITY,
  type ComplaintReason,
  type ComplaintStatus,
} from '@platform/contracts';

// One complaint of one person about the other side of a ride (docs/17).
export type ComplaintRecord = {
  readonly id: string;
  readonly authorId: number;
  readonly againstId: number;
  readonly bookingId: string;
  readonly reason: ComplaintReason;
  readonly comment: string;
  readonly status: ComplaintStatus;
  // "none", "warning", "block:7", "block:forever", with ":refund" when the commission went back.
  readonly decision: string | null;
  readonly decidedBy: number | null;
  readonly createdAt: number;
  readonly decidedAt: number | null;
};

export const isHigh = (reason: ComplaintReason) => HIGH_PRIORITY.includes(reason);

// The queue of the team: high priority first, then the oldest (docs/17).
export const queueOrder = (a: ComplaintRecord, b: ComplaintRecord) =>
  Number(isHigh(b.reason)) - Number(isHigh(a.reason)) || a.createdAt - b.createdAt;

// Complaints from HIDE_AFTER_COMPLAINTS different people in COMPLAINT_WINDOW_DAYS hide a person from
// the search until the moderator decides (docs/17).
export function hiddenPeople(complaints: readonly ComplaintRecord[], now: number): Set<number> {
  const since = now - COMPLAINT_WINDOW_DAYS * DAY_MS;
  const authors = new Map<number, Set<number>>();
  for (const complaint of complaints) {
    if (complaint.status === 'resolved' || complaint.createdAt < since) continue;
    const known = authors.get(complaint.againstId) ?? new Set<number>();
    authors.set(complaint.againstId, known.add(complaint.authorId));
  }
  return new Set([...authors].filter(([, who]) => who.size >= HIDE_AFTER_COMPLAINTS).map(([id]) => id));
}
