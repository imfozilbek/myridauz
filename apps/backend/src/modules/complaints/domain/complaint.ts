import {
  DAY_MS,
  HIGH_PRIORITY,
  type ComplaintReason,
  type ComplaintStatus,
  type RefundState,
} from '@platform/contracts';

// The refund of the commission of a no-show (docs/35, G63): a moderator proposes it with the
// decision, the owner confirms or rejects it once.
type RefundMark = {
  readonly state: RefundState;
  readonly proposedBy: number;
  readonly proposedAt: number;
  readonly decidedBy: number | null;
  readonly decidedAt: number | null;
};

// One complaint of one person about the other side of a ride (docs/17).
export type ComplaintRecord = {
  readonly id: string;
  readonly authorId: number;
  readonly againstId: number;
  readonly bookingId: string;
  readonly reason: ComplaintReason;
  readonly comment: string;
  readonly status: ComplaintStatus;
  // "none", "warning", "block:7", "block:forever", with ":refund" when a refund was proposed.
  readonly decision: string | null;
  readonly decidedBy: number | null;
  readonly createdAt: number;
  readonly decidedAt: number | null;
  readonly refund: RefundMark | null;
};

export const isHigh = (reason: ComplaintReason) => HIGH_PRIORITY.includes(reason);

// The queue of the team: high priority first, then the oldest (docs/17).
export const queueOrder = (a: ComplaintRecord, b: ComplaintRecord) =>
  Number(isHigh(b.reason)) - Number(isHigh(a.reason)) || a.createdAt - b.createdAt;

// Complaints from hideAfter different people in windowDays hide a person from the search until the
// moderator decides (docs/17); the brand gives both, the owner changes them (docs/128 §4).
type HideRule = { readonly hideAfter: number; readonly windowDays: number };

export function hiddenPeople(
  complaints: readonly ComplaintRecord[],
  now: number,
  rule: HideRule,
): Set<number> {
  const since = now - rule.windowDays * DAY_MS;
  const authors = new Map<number, Set<number>>();
  for (const complaint of complaints) {
    if (complaint.status === 'resolved' || complaint.createdAt < since) continue;
    const known = authors.get(complaint.againstId) ?? new Set<number>();
    authors.set(complaint.againstId, known.add(complaint.authorId));
  }
  return new Set([...authors].filter(([, who]) => who.size >= rule.hideAfter).map(([id]) => id));
}
