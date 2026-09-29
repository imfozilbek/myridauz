import {
  ADMIN_COMPLAINTS_PATH,
  adminComplaintChatPath,
  adminComplaintDecisionPath,
  adminComplaintPath,
  COMPLAINTS_PATH,
  complaintChatSchema,
  complaintQueueSchema,
  complaintSchema,
  reviewPath,
  REVIEWS_PATH,
  reviewTargetSchema,
  userReviewsPath,
  userReviewsSchema,
  type ChatLine,
  type Complaint,
  type ComplaintDecision,
  type ComplaintInput,
  type ReviewInput,
  type ReviewTarget,
  type UserReviews,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// Ratings, reviews and complaints (docs/17, docs/24, G11): people rate and complain, the team decides.
export function createFeedbackClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  return {
    target: async (bookingId: string): Promise<ReviewTarget> =>
      reviewTargetSchema.parse(await (await request(reviewPath(bookingId))).json()),
    review: async (input: ReviewInput): Promise<void> => void (await post(REVIEWS_PATH, input)),
    reviewsOf: async (userId: number): Promise<UserReviews> =>
      userReviewsSchema.parse(await (await request(userReviewsPath(userId))).json()),
    complain: async (input: ComplaintInput): Promise<void> => void (await post(COMPLAINTS_PATH, input)),
    queue: async (): Promise<Complaint[]> =>
      complaintQueueSchema.parse(await (await request(ADMIN_COMPLAINTS_PATH)).json()).complaints,
    complaint: async (id: string): Promise<Complaint> =>
      complaintSchema.parse(await (await request(adminComplaintPath(id))).json()),
    chat: async (id: string): Promise<ChatLine[]> =>
      complaintChatSchema.parse(await (await post(adminComplaintChatPath(id), {})).json()).lines,
    decide: async (id: string, decision: ComplaintDecision): Promise<void> =>
      void (await post(adminComplaintDecisionPath(id), decision)),
  };
}

export type FeedbackClient = ReturnType<typeof createFeedbackClient>;
