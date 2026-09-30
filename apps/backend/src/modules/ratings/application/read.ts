import { NO_RATING, type Rating, type UserReviews } from '@platform/contracts';
import { isPublished, ratingOf } from '../domain/rating';
import type { RatingsDeps } from './ports';

// The newest published reviews of a person (docs/24).
const SHOWN_REVIEWS = 20;

async function published(deps: RatingsDeps, userIds: readonly number[]) {
  const [about, answered] = await Promise.all([deps.store.about(userIds), deps.store.writtenBy(userIds)]);
  const now = deps.now();
  return about.filter((review) => isPublished(review, answered, now));
}

export async function reviewsOf(deps: RatingsDeps, userId: number): Promise<UserReviews> {
  const reviews = (await published(deps, [userId])).sort((a, b) => b.createdAt - a.createdAt);
  const names = await deps.names([...new Set(reviews.map((review) => review.raterId))]);
  return {
    rating: ratingOf(reviews.map((review) => review.stars)),
    reviews: reviews.slice(0, SHOWN_REVIEWS).map((review) => ({
      id: review.id,
      authorName: names.get(review.raterId) ?? '',
      stars: review.stars,
      tags: [...review.tags],
      text: review.text,
      at: review.createdAt,
    })),
  };
}

// The ratings of many people at once: the trip search and the channel post (docs/24, docs/54).
export async function ratingsOf(deps: RatingsDeps, userIds: readonly number[]): Promise<Map<number, Rating>> {
  if (userIds.length === 0) return new Map();
  const reviews = await published(deps, userIds);
  return new Map(
    userIds.map((id) => {
      const stars = reviews.filter((review) => review.rateeId === id).map((review) => review.stars);
      return [id, stars.length === 0 ? NO_RATING : ratingOf(stars)];
    }),
  );
}

// "Safarlar tarixi" (G18): per booking, the stars a person gave, and the stars the person got
// once they are published (the blind rule, docs/24).
export async function starsOfRides(deps: RatingsDeps, userId: number) {
  const [given, received] = await Promise.all([deps.store.by(userId), published(deps, [userId])]);
  const byBooking = (reviews: readonly { bookingId: string; stars: number }[]) =>
    new Map(reviews.map((review) => [review.bookingId, review.stars]));
  return { given: byBooking(given), received: byBooking(received) };
}
