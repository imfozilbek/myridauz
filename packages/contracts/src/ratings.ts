import { z } from 'zod';
import { personIdSchema, type PersonId } from './person-id';

// Ratings and blind reviews after a trip (docs/24). G11.
export const REVIEWS_PATH = '/reviews';
export const userReviewsPath = (userId: PersonId) => `/users/${userId}/reviews`;
export const adminReviewHidePath = (reviewId: string) => `/admin/reviews/${reviewId}/hide`;

export const STARS = [1, 2, 3, 4, 5] as const;
// Fewer published ratings than this: "Yangi" instead of the number.
export const MIN_SHOWN_RATINGS = 3;
// A review stays hidden until the other side reviews too, or this many days pass.
export const BLIND_DAYS = 14;
// The bot asks once, reminds once after this many hours, and takes answers this many days.
export const RATING_REMIND_HOURS = 24;
export const RATING_DAYS = 14;
// 1 or 2 stars: the person is offered to complain (docs/17).
export const COMPLAIN_BELOW_STARS = 3;
// An average below this with at least this many ratings goes to a moderator (docs/24).
export const REVIEW_AVERAGE = 3.5;
export const REVIEW_MIN_COUNT = 10;
export const REVIEW_TEXT_MAX = 300;

// Quick tags: a passenger rates the driver, a driver rates a passenger (docs/24).
export const DRIVER_TAGS = ['on_time', 'careful', 'clean_car', 'polite'] as const;
export const PASSENGER_TAGS = ['on_time', 'polite', 'tidy'] as const;
const TAGS = [...new Set([...DRIVER_TAGS, ...PASSENGER_TAGS])] as [string, ...string[]];
export type ReviewTag = (typeof DRIVER_TAGS)[number] | (typeof PASSENGER_TAGS)[number];

export const reviewInputSchema = z.object({
  bookingId: z.string().min(1).max(64),
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.enum(TAGS)).max(TAGS.length).default([]),
  text: z.string().trim().max(REVIEW_TEXT_MAX).default(''),
});
export type ReviewInput = z.input<typeof reviewInputSchema>;

// A published review as other people see it: the author's first name only (docs/07).
export const reviewSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  stars: z.number().int(),
  tags: z.array(z.string()),
  text: z.string(),
  at: z.number().int(),
});
export type Review = z.infer<typeof reviewSchema>;

// "⭐ 4,8 (37)"; average is null while there are fewer than MIN_SHOWN_RATINGS.
export const ratingSchema = z.object({ average: z.number().nullable(), count: z.number().int() });
export type Rating = z.infer<typeof ratingSchema>;
export const NO_RATING: Rating = { average: null, count: 0 };

export const userReviewsSchema = z.object({ rating: ratingSchema, reviews: z.array(reviewSchema) });
export type UserReviews = z.infer<typeof userReviewsSchema>;

// The review screen of a ride: whom the person rates and what they wrote before.
export const reviewPath = (bookingId: string) => `${REVIEWS_PATH}/${bookingId}`;
export const reviewTargetSchema = z.object({
  // The driver's id lets the passenger save the driver after the review (G18, docs/18).
  rateeId: personIdSchema,
  rateeName: z.string(),
  rateeRole: z.enum(['driver', 'passenger']),
  mine: z.object({ stars: z.number().int(), tags: z.array(z.string()), text: z.string() }).nullable(),
});
export type ReviewTarget = z.infer<typeof reviewTargetSchema>;
