import { COMPLAINT_REASONS, STARS, type ComplaintReason } from '@platform/contracts';
import type { DraftCheck } from '../screen/draft';

// A review or a complaint being written is kept on this phone per booking (docs/94 F3):
// closed before sending, it comes back as it was; sent, it is gone.
export type ReviewDraft = { readonly stars: number; readonly tags: readonly string[]; readonly text: string };
export type ComplaintDraft = { readonly reasons: readonly ComplaintReason[]; readonly comment: string };

export const reviewDraftKey = (bookingId: string) => `review:${bookingId}`;
export const complaintDraftKey = (bookingId: string) => `complaint:${bookingId}`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isStars = (value: unknown): value is number => value === 0 || STARS.some((stars) => stars === value);
const isTags = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((tag) => typeof tag === 'string');
const isReasons = (value: unknown): value is readonly ComplaintReason[] =>
  Array.isArray(value) && value.every((item) => COMPLAINT_REASONS.some((reason) => reason === item));

export const checkReviewDraft: DraftCheck<ReviewDraft> = (value) =>
  isObject(value) && isStars(value.stars) && isTags(value.tags) && typeof value.text === 'string'
    ? { stars: value.stars, tags: value.tags, text: value.text }
    : null;

export const checkComplaintDraft: DraftCheck<ComplaintDraft> = (value) =>
  isObject(value) && isReasons(value.reasons) && typeof value.comment === 'string'
    ? { reasons: value.reasons, comment: value.comment }
    : null;
