import {
  DAY_MS,
  DRIVER_TAGS,
  PASSENGER_TAGS,
  RATING_DAYS,
  reviewInputSchema,
  type ReviewTarget,
} from '@platform/contracts';
import type { z } from 'zod';
import { needsModerator, ratingOf } from '../domain/rating';
import type { RatingsDeps, Ride } from './ports';

type Input = z.output<typeof reviewInputSchema>;
type Failure = 'reviews.not_found' | 'reviews.not_over' | 'reviews.too_late';

// Only the two sides of a ride that is over, within RATING_DAYS (docs/24).
async function rideFor(deps: RatingsDeps, bookingId: string, raterId: number): Promise<Ride | Failure> {
  const ride = await deps.rides.find(bookingId);
  if (!ride || (raterId !== ride.driverId && raterId !== ride.passengerId)) return 'reviews.not_found';
  if (!ride.over) return 'reviews.not_over';
  return ride.endsAt + RATING_DAYS * DAY_MS < deps.now() ? 'reviews.too_late' : ride;
}

const rateeOf = (ride: Ride, raterId: number) =>
  raterId === ride.driverId ? ride.passengerId : ride.driverId;

// Stars from the bot keep the tags and the text written in the Mini App before.
export async function rate(deps: RatingsDeps, raterId: number, input: Input, fromBot = false) {
  const ride = await rideFor(deps, input.bookingId, raterId);
  if (typeof ride === 'string') return ride;
  const rateeId = rateeOf(ride, raterId);
  const allowed: readonly string[] = rateeId === ride.driverId ? DRIVER_TAGS : PASSENGER_TAGS;
  const old = await deps.store.review(input.bookingId, raterId);
  const now = deps.now();
  await deps.store.saveReview({
    id: old?.id ?? deps.newId(),
    bookingId: input.bookingId,
    raterId,
    rateeId,
    stars: input.stars,
    tags: fromBot && old ? old.tags : input.tags.filter((tag) => allowed.includes(tag)),
    text: fromBot && old ? old.text : deps.mask(input.text),
    hidden: old?.hidden ?? false,
    createdAt: old?.createdAt ?? now,
    updatedAt: now,
  });
  await watch(deps, rateeId, now);
  return 'ok' as const;
}

// A low average goes to a moderator once (docs/24).
async function watch(deps: RatingsDeps, userId: number, now: number) {
  const stars = (await deps.store.about([userId]))
    .filter((review) => !review.hidden)
    .map((review) => review.stars);
  if (needsModerator(stars) && (await deps.store.flag(userId, now)))
    await deps.alertTeam(userId, ratingOf(stars));
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
