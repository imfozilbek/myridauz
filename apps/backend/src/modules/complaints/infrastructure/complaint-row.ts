import { COMPLAINT_REASONS, type ComplaintStatus, type RefundState } from '@platform/contracts';
import type { ComplaintRecord } from '../domain/complaint';

// A row of the table complaints (migrations/0012, 0048) and back.
export type Row = {
  id: string;
  author_id: number;
  against_id: number;
  booking_id: string;
  reason: string;
  comment: string;
  status: string;
  decision: string | null;
  decided_by: number | null;
  created_at: number;
  decided_at: number | null;
  refund_state: string | null;
  refund_proposed_by: number | null;
  refund_proposed_at: number | null;
  refund_decided_by: number | null;
  refund_decided_at: number | null;
};

const refundOf = (row: Row): ComplaintRecord['refund'] =>
  row.refund_state === null || row.refund_proposed_by === null || row.refund_proposed_at === null
    ? null
    : {
        state: row.refund_state as RefundState,
        proposedBy: row.refund_proposed_by,
        proposedAt: row.refund_proposed_at,
        decidedBy: row.refund_decided_by,
        decidedAt: row.refund_decided_at,
      };

// The reasons in the one column reason, joined by a comma: an old row holds one (G75).
const REASON_SEPARATOR = ',';
export const reasonsText = (reasons: ComplaintRecord['reasons']) => reasons.join(REASON_SEPARATOR);
const reasonsOf = (text: string) => {
  const kept = text.split(REASON_SEPARATOR);
  return COMPLAINT_REASONS.filter((reason) => kept.includes(reason));
};

export const toComplaint = (row: Row): ComplaintRecord => ({
  id: row.id,
  authorId: row.author_id,
  againstId: row.against_id,
  bookingId: row.booking_id,
  reasons: reasonsOf(row.reason),
  comment: row.comment,
  status: row.status as ComplaintStatus,
  decision: row.decision,
  decidedBy: row.decided_by,
  createdAt: row.created_at,
  decidedAt: row.decided_at,
  refund: refundOf(row),
});

// The refund in its columns: written with the decision, kept on every later save (G63).
export const REFUND_COLUMNS = [
  'refund_state',
  'refund_proposed_by',
  'refund_proposed_at',
  'refund_decided_by',
  'refund_decided_at',
] as const;
export const refundValues = ({ refund }: ComplaintRecord) =>
  [
    refund?.state ?? null,
    refund?.proposedBy ?? null,
    refund?.proposedAt ?? null,
    refund?.decidedBy ?? null,
    refund?.decidedAt ?? null,
  ] as const;
