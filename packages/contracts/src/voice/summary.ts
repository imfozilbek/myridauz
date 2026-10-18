import { z } from 'zod';
import { COMPLAINT_REASONS } from '../complaints';
import { REVIEW_TAGS } from '../ratings';
import { LEAVE_KINDS, LEAVE_REASON_IDS } from './leave-reasons';

// What people feel, in numbers only (G87, docs/191): never a name, a text or who.
const count = z.number().int().nonnegative();

// The ratings of the period: their mean, the trips of 1 or 2 stars, the tags people gave.
export const ratingsSummarySchema = z.object({
  count,
  average: z.number().min(0).max(5),
  low: count,
  tags: z.array(z.object({ tag: z.enum(REVIEW_TAGS), count })),
});
export type RatingsSummary = z.infer<typeof ratingsSummarySchema>;

// One complaint may name several reasons: each counts once.
export const complaintReasonCountSchema = z.object({ reason: z.enum(COMPLAINT_REASONS), count });
export type ComplaintReasonCount = z.infer<typeof complaintReasonCountSchema>;

// The reasons people gave after a cancel or a deleted account.
export const leaveCountSchema = z.object({
  kind: z.enum(LEAVE_KINDS),
  reason: z.enum(LEAVE_REASON_IDS),
  count,
});
export type LeaveCount = z.infer<typeof leaveCountSchema>;

// How the Mini Apps were opened: from a message of a bot, straight from the menu, or by a link (a
// post, an ad, a friend). Sessions, not people.
export const OPEN_KINDS = ['bot', 'direct', 'link'] as const;
export type OpenKind = (typeof OPEN_KINDS)[number];
export const openCountSchema = z.object({ kind: z.enum(OPEN_KINDS), count });
export type OpenCount = z.infer<typeof openCountSchema>;
