import type { BrandConfig } from '@platform/brands';
import type { Rating } from '@platform/contracts';
import type { StoredReview } from '../domain/rating';

// A ride as the ratings see it: set by the app from the bookings module (module-events.ts).
export type Ride = {
  readonly bookingId: string;
  // The trip of the ride: the ask answers its card in the driver bot (G68).
  readonly tripId: string;
  readonly driverId: number;
  readonly passengerId: number;
  readonly endsAt: number;
  readonly over: boolean;
};

// Who rates in which bot, and the trip whose card the ask answers (G68).
export type AskedAt = { readonly rater: 'driver' | 'passenger'; readonly tripId: string };

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
  // A deleted account: the reviews it wrote and the reviews about it go (docs/65 A5).
  forget(userId: number): Promise<void>;
};

export type RatingsDeps = {
  readonly store: RatingStore;
  readonly rides: {
    ended(from: number, to: number): Promise<Ride[]>;
    find(bookingId: string): Promise<Ride | undefined>;
  };
  readonly names: (ids: readonly number[]) => Promise<Map<number, string>>;
  // The public id of a person and back: the apps never see a Telegram ID (docs/65 A3).
  readonly people: {
    publicId(id: number): Promise<string | undefined>;
    idOf(publicId: string): Promise<number | undefined>;
  };
  // The bot of the rater: the passenger bot for a passenger, the driver bot for a driver.
  readonly ask: (ask: Ask, rateeName: string, at: AskedAt, reminder: boolean) => Promise<void>;
  // The team sees the public id, never the Telegram ID (docs/65 A3).
  readonly alertTeam: (person: { name: string; publicId: string }, rating: Rating) => Promise<void>;
  // The person hears it too, in the bot of the role they were rated in (G75, docs/158 З).
  readonly tellLow: (userId: number, role: 'driver' | 'passenger', rating: Rating) => Promise<void>;
  // Contacts in the text become "***", as in the chat (docs/07).
  readonly mask: (text: string) => string;
  // The days, the reminder and the rules of ratings (brand with the owner's values, docs/128 §4).
  readonly limits: BrandConfig['ratings'];
  readonly now: () => number;
  readonly newId: () => string;
};
