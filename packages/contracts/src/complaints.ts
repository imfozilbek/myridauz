import { z } from 'zod';
import { personIdSchema } from './person-id';
import { BLOCK_DAYS } from './moderation';

// Complaints and the moderator's decisions (docs/17). G11.
export const COMPLAINTS_PATH = '/complaints';
export const ADMIN_COMPLAINTS_PATH = '/admin/complaints';
// What a person sees of the complaints about them (G75, docs/158 З): out of the search, a warning.
export const COMPLAINT_NOTES_PATH = '/complaints/mine';
export const complaintNotesSchema = z.object({
  hidden: z.boolean(),
  warnedAt: z.number().int().nullable(),
});
export type ComplaintNotes = z.infer<typeof complaintNotesSchema>;
export const adminComplaintPath = (id: string) => `${ADMIN_COMPLAINTS_PATH}/${id}`;
export const adminComplaintChatPath = (id: string) => `${adminComplaintPath(id)}/chat`;
export const adminComplaintDecisionPath = (id: string) => `${adminComplaintPath(id)}/decision`;
// The refund of a no-show: a moderator proposes it with the decision, the owner answers (docs/35, G63).
export const REFUND_ANSWERS = ['confirm', 'reject'] as const;
export type RefundAnswer = (typeof REFUND_ANSWERS)[number];
export const adminComplaintRefundPath = (id: string, answer: RefundAnswer) =>
  `${adminComplaintPath(id)}/refund/${answer}`;
export const REFUND_STATES = ['proposed', 'confirmed', 'rejected'] as const;
export type RefundState = (typeof REFUND_STATES)[number];
export const complaintRefundSchema = z.object({ state: z.enum(REFUND_STATES), amount: z.number().int() });
export type ComplaintRefund = z.infer<typeof complaintRefundSchema>;

export const COMPLAINT_REASONS = [
  'harassment',
  'unsafe_driving',
  'fake_profile',
  'no_show',
  'car_mismatch',
  'price_changed',
  'spam_fraud',
  'other',
] as const;
export type ComplaintReason = (typeof COMPLAINT_REASONS)[number];
// These go to the team at once (docs/17).
export const HIGH_PRIORITY: readonly ComplaintReason[] = ['harassment', 'unsafe_driving', 'fake_profile'];
export const COMPLAINT_COMMENT_MAX = 500;

// One complaint names one or more reasons as ticks (owner decision 10.10.2026, docs/124): kept once
// each, in the order of COMPLAINT_REASONS, so the gravest comes first and leads the case.
export const complaintReasonsSchema = z
  .array(z.enum(COMPLAINT_REASONS))
  .min(1)
  .transform((picked) => COMPLAINT_REASONS.filter((reason) => picked.includes(reason)));

export const complaintInputSchema = z.object({
  bookingId: z.string().min(1).max(64),
  reasons: complaintReasonsSchema,
  comment: z.string().trim().max(COMPLAINT_COMMENT_MAX).default(''),
});
export type ComplaintInput = z.input<typeof complaintInputSchema>;

export const COMPLAINT_STATUSES = ['new', 'in_review', 'resolved'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

// A side of a complaint as the moderator sees it: never the phone (docs/07).
export const partySchema = z.object({
  id: personIdSchema,
  firstName: z.string(),
  hasAvatar: z.boolean(),
  role: z.enum(['driver', 'passenger']),
  trips: z.number().int(),
  complaints: z.number().int(),
});
export type Party = z.infer<typeof partySchema>;

export const complaintSchema = z.object({
  id: z.string(),
  reasons: z.array(z.enum(COMPLAINT_REASONS)).min(1),
  high: z.boolean(),
  comment: z.string(),
  status: z.enum(COMPLAINT_STATUSES),
  createdAt: z.number().int(),
  tripId: z.string(),
  departAt: z.number().int(),
  author: partySchema,
  against: partySchema,
  // The refund of the commission proposed with the decision of a no-show (docs/35).
  refund: complaintRefundSchema.nullable().default(null),
});
export type Complaint = z.infer<typeof complaintSchema>;
export const complaintQueueSchema = z.object({ complaints: z.array(complaintSchema) });

// The chat of the booking, read only for this complaint and written to the log (docs/07).
export const chatLineSchema = z.object({
  author: personIdSchema.nullable(),
  text: z.string(),
  at: z.number().int(),
});
export const complaintChatSchema = z.object({ lines: z.array(chatLineSchema) });
export type ChatLine = z.infer<typeof chatLineSchema>;

export const COMPLAINT_DECISIONS = ['none', 'warning', 'block'] as const;
export const complaintDecisionSchema = z.object({
  action: z.enum(COMPLAINT_DECISIONS),
  // Only with "block": 1, 7, 30 days or null for good (Telegram ID and phone).
  days: z
    .union([z.literal(BLOCK_DAYS[0]), z.literal(BLOCK_DAYS[1]), z.literal(BLOCK_DAYS[2]), z.null()])
    .optional(),
  // A no-show: the refund of the commission is proposed; the owner confirms it (docs/35, G63).
  refund: z.boolean().default(false),
});
export type ComplaintDecision = z.input<typeof complaintDecisionSchema>;
