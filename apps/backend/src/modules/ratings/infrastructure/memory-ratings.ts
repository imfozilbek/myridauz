import type { Ask, RatingStore } from '../application/ports';
import type { StoredReview } from '../domain/rating';

// In memory: tests and local runs without D1.
export function createMemoryRatings(): RatingStore {
  const asks: (Ask & { reminded: boolean })[] = [];
  const reviews = new Map<string, StoredReview>();
  const flags = new Set<number>();
  const key = (bookingId: string, raterId: number) => `${bookingId}:${raterId}`;
  return {
    askedBookings: async (ids) =>
      new Set(asks.filter((ask) => ids.includes(ask.bookingId)).map((ask) => ask.bookingId)),
    saveAsks: async (fresh) => void asks.push(...fresh.map((ask) => ({ ...ask, reminded: false }))),
    toRemind: async (before, after) =>
      asks.filter(
        (ask) =>
          !ask.reminded &&
          ask.askedAt <= before &&
          ask.askedAt > after &&
          !reviews.has(key(ask.bookingId, ask.raterId)),
      ),
    markReminded: async (done) => {
      for (const ask of asks)
        if (ask.bookingId === done.bookingId && ask.raterId === done.raterId) ask.reminded = true;
    },
    review: async (bookingId, raterId) => reviews.get(key(bookingId, raterId)),
    saveReview: async (review) => void reviews.set(key(review.bookingId, review.raterId), review),
    about: async (ids) => [...reviews.values()].filter((review) => ids.includes(review.rateeId)),
    writtenBy: async (ids) =>
      new Set(
        [...reviews.values()]
          .filter((review) => ids.includes(review.raterId))
          .map((r) => key(r.bookingId, r.raterId)),
      ),
    hide: async (id) => {
      const review = [...reviews.values()].find((known) => known.id === id);
      if (review) reviews.set(key(review.bookingId, review.raterId), { ...review, hidden: true });
      return review !== undefined;
    },
    flag: async (userId) => {
      if (flags.has(userId)) return false;
      flags.add(userId);
      return true;
    },
  };
}
