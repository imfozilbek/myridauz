import { DAY_MS, type Rating } from '@platform/contracts';

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

// The rules of ratings: the brand gives them, the owner changes them (docs/24, docs/128 §4).
type RatingRule = {
  readonly blindDays: number;
  readonly minShown: number;
  readonly lowAverage: number;
  readonly lowCount: number;
};

// "Slepaya" publication: a review shows once the other side reviewed the same ride too,
// or blindDays passed. Nobody answers a bad review with revenge (docs/24).
const counterpartKey = (review: StoredReview) => `${review.bookingId}:${review.rateeId}`;
export const isPublished = (
  review: StoredReview,
  answered: ReadonlySet<string>,
  now: number,
  rule: Pick<RatingRule, 'blindDays'>,
) =>
  !review.hidden &&
  (answered.has(counterpartKey(review)) || review.createdAt + rule.blindDays * DAY_MS <= now);

const TENTHS = 10;

// "⭐ 4,8 (37)": the average of published stars, one decimal; "Yangi" below minShown.
export function ratingOf(stars: readonly number[], rule: Pick<RatingRule, 'minShown'>): Rating {
  const count = stars.length;
  if (count < rule.minShown) return { average: null, count };
  const sum = stars.reduce((total, value) => total + value, 0);
  return { average: Math.round((sum / count) * TENTHS) / TENTHS, count };
}

// A low rating goes to a moderator (docs/24): the average below lowAverage after lowCount ratings.
export const needsModerator = (stars: readonly number[], rule: RatingRule) =>
  stars.length >= rule.lowCount &&
  stars.reduce((total, value) => total + value, 0) / stars.length < rule.lowAverage;
