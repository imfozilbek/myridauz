import {
  DAY_MS,
  DRIVER_TAGS,
  PASSENGER_TAGS,
  reviewInputSchema,
  type ReviewTarget,
} from '@platform/contracts';
import type { z } from 'zod';
import { isSettled, needsModerator, ratingOf } from '../domain/rating';
import type { RatingsDeps, Ride } from './ports';
import { published } from './read';

type Input = z.output<typeof reviewInputSchema>;
type Failure = 'reviews.not_found' | 'reviews.not_over' | 'reviews.too_late' | 'reviews.published';

// Only the two sides of a ride that is over, within the brand's days (docs/24).
async function rideFor(deps: RatingsDeps, bookingId: string, raterId: number): Promise<Ride | Failure> {
  const ride = await deps.rides.find(bookingId);
  if (!ride || (raterId !== ride.driverId && raterId !== ride.passengerId)) return 'reviews.not_found';
  if (!ride.over) return 'reviews.not_over';
  return ride.endsAt + deps.limits.days * DAY_MS < deps.now() ? 'reviews.too_late' : ride;
}

const rateeOf = (ride: Ride, raterId: number) =>
  raterId === ride.driverId ? ride.passengerId : ride.driverId;

// Stars from the bot keep the tags and the text written in the Mini App, before or at the same time.
export async function rate(deps: RatingsDeps, raterId: number, input: Input, fromBot = false) {
  const ride = await rideFor(deps, input.bookingId, raterId);
  if (typeof ride === 'string') return ride;
  const rateeId = rateeOf(ride, raterId);
  const allowed: readonly string[] = rateeId === ride.driverId ? DRIVER_TAGS : PASSENGER_TAGS;
  const now = deps.now();
  const [mine, theirs] = await Promise.all([
    deps.store.review(input.bookingId, raterId),
    deps.store.review(input.bookingId, rateeId),
  ]);
  if (isSettled(mine, theirs !== undefined, now, deps.limits)) return 'reviews.published';
  const review = {
    id: deps.newId(),
    bookingId: input.bookingId,
    raterId,
    rateeId,
    stars: input.stars,
    tags: input.tags.filter((tag) => allowed.includes(tag)),
    text: deps.mask(input.text),
    hidden: false,
    createdAt: now,
    updatedAt: now,
    rideEndsAt: ride.endsAt,
  };
  await deps.store.saveReview(review, fromBot);
  // This review may publish the other side's review of the rater too: both are watched (G89 A9).
  const roleOf = (userId: number) => (userId === ride.driverId ? 'driver' : 'passenger');
  for (const userId of [rateeId, raterId]) await watch(deps, userId, roleOf(userId), now);
  return 'ok' as const;
}

// A low average goes to a moderator once (docs/24), and to the person (G75): of the published
// reviews only, as people see it; a blind review is not told before it shows (G89 A9).
async function watch(deps: RatingsDeps, userId: number, role: 'driver' | 'passenger', now: number) {
  const stars = (await published(deps, [userId])).map((review) => review.stars);
  if (!needsModerator(stars, deps.limits) || !(await deps.store.flag(userId, now))) return;
  const name = (await deps.names([userId])).get(userId) ?? '';
  const rating = ratingOf(stars, deps.limits);
  await deps.alertTeam({ name, publicId: (await deps.people.publicId(userId)) ?? '' }, rating);
  await deps.tellLow(userId, role, rating);
}

// The review screen: whom the person rates and their own review of this ride.
export async function reviewTarget(deps: RatingsDeps, raterId: number, bookingId: string) {
  const ride = await rideFor(deps, bookingId, raterId);
  if (typeof ride === 'string') return ride;
  const rateeId = rateeOf(ride, raterId);
  const [names, mine, publicId] = await Promise.all([
    deps.names([rateeId]),
    deps.store.review(bookingId, raterId),
    deps.people.publicId(rateeId),
  ]);
  const target: ReviewTarget = {
    rateeId: publicId ?? '',
    rateeName: names.get(rateeId) ?? '',
    rateeRole: rateeId === ride.driverId ? 'driver' : 'passenger',
    mine: mine ? { stars: mine.stars, tags: [...mine.tags], text: mine.text } : null,
  };
  return target;
}
