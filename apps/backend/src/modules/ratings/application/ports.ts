import type { Rating } from '@platform/contracts';
import type { StoredReview } from '../domain/rating';

// A ride as the ratings see it: set by the app from the bookings module (module-events.ts).
export type Ride = {
  readonly bookingId: string;
  readonly driverId: number;
  readonly passengerId: number;
  readonly endsAt: number;
  readonly over: boolean;
};

// The bot asks the rater about the ratee once, then reminds once (docs/24).
export type Ask = {
  readonly bookingId: string;
  readonly raterId: number;
  readonly rateeId: number;
  readonly askedAt: number;
};

export type RatingStore = {
  askedBookings(bookingIds: readonly string[]): Promise<Set<string>>;
  saveAsks(asks: readonly Ask[]): Promise<void>;
  // Asks older than `before` and newer than `after`, not reminded and without a review.
  toRemind(before: number, after: number): Promise<Ask[]>;
  markReminded(ask: Ask): Promise<void>;
  review(bookingId: string, raterId: number): Promise<StoredReview | undefined>;
  saveReview(review: StoredReview): Promise<void>;
  about(userIds: readonly number[]): Promise<StoredReview[]>;
  // Every review this person wrote: "Safarlar tarixi" shows the stars given (G18).
  by(raterId: number): Promise<StoredReview[]>;
  // "booking:rater" of every review these people wrote: the other side of the blind rule.
  writtenBy(userIds: readonly number[]): Promise<Set<string>>;
  hide(reviewId: string): Promise<boolean>;
  flag(userId: number, at: number): Promise<boolean>;
};

export type RatingsDeps = {
  readonly store: RatingStore;
  readonly rides: {
    ended(from: number, to: number): Promise<Ride[]>;
    find(bookingId: string): Promise<Ride | undefined>;
  };
  readonly names: (ids: readonly number[]) => Promise<Map<number, string>>;
  // The bot of the rater: the passenger bot for a passenger, the driver bot for a driver.
  readonly ask: (
    ask: Ask,
    rateeName: string,
    rater: 'driver' | 'passenger',
    reminder: boolean,
  ) => Promise<void>;
  readonly alertTeam: (userId: number, rating: Rating) => Promise<void>;
  // Contacts in the text become "***", as in the chat (docs/07).
  readonly mask: (text: string) => string;
  readonly now: () => number;
  readonly newId: () => string;
};
