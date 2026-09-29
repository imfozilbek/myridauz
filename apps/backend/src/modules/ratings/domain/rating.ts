import {
  BLIND_DAYS,
  DAY_MS,
  MIN_SHOWN_RATINGS,
  REVIEW_AVERAGE,
  REVIEW_MIN_COUNT,
  type Rating,
} from '@platform/contracts';

// One side's review of the other after a ride (docs/24).
export type StoredReview = {
  readonly id: string;
  readonly bookingId: string;
  readonly raterId: number;
  readonly rateeId: number;
  readonly stars: number;
  readonly tags: readonly string[];
  readonly text: string;
  readonly hidden: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
};

// "Slepaya" publication: a review shows once the other side reviewed the same ride too,
// or BLIND_DAYS passed. Nobody answers a bad review with revenge (docs/24).
const counterpartKey = (review: StoredReview) => `${review.bookingId}:${review.rateeId}`;
export const isPublished = (review: StoredReview, answered: ReadonlySet<string>, now: number) =>
  !review.hidden && (answered.has(counterpartKey(review)) || review.createdAt + BLIND_DAYS * DAY_MS <= now);

const TENTHS = 10;

// "⭐ 4,8 (37)": the average of published stars, one decimal; "Yangi" below MIN_SHOWN_RATINGS.
export function ratingOf(stars: readonly number[]): Rating {
  const count = stars.length;
  if (count < MIN_SHOWN_RATINGS) return { average: null, count };
  const sum = stars.reduce((total, value) => total + value, 0);
  return { average: Math.round((sum / count) * TENTHS) / TENTHS, count };
}

// A low rating goes to a moderator (docs/24): the average below REVIEW_AVERAGE after REVIEW_MIN_COUNT.
export const needsModerator = (stars: readonly number[]) =>
  stars.length >= REVIEW_MIN_COUNT &&
  stars.reduce((total, value) => total + value, 0) / stars.length < REVIEW_AVERAGE;
