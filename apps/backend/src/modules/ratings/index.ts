import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { maskContacts } from '../chat';
import { notify } from '../notifications';
import { tellOwners } from '../team-queue';
import { peopleOf } from '../users';
import { askRatings } from './application/ask';
import type { RatingsDeps, Ride } from './application/ports';
import { rate } from './application/rate';
import { ratingsOf, standingOf, starsOfRides } from './application/read';
import { reviewRoutes } from './http/review-routes';
import { botAsker } from './infrastructure/bot-asker';
import { d1Ratings } from './infrastructure/d1-ratings';
import { createMemoryRatings } from './infrastructure/memory-ratings';

const { t, formatNumber } = createI18n(DEFAULT_LOCALE);
const localRatings = createMemoryRatings();

// The rides and the names come from other modules: set by the app (module-events.ts).
type Wiring = {
  ended: (env: Bindings, from: number, to: number) => Promise<Ride[]>;
  ride: (env: Bindings, bookingId: string) => Promise<Ride | undefined>;
  names: (env: Bindings, ids: readonly number[]) => Promise<Map<number, string>>;
};
let wiring: Wiring | undefined;
export const wireRatings = (next: Wiring) => void (wiring = next);

const ratingsDeps = (env: Bindings): RatingsDeps => {
  if (!wiring) throw new Error('ratings.not_wired');
  const { ended, ride, names } = wiring;
  return {
    store: env.DB ? d1Ratings(env.DB) : localRatings,
    rides: { ended: (from, to) => ended(env, from, to), find: (id) => ride(env, id) },
    names: (ids) => names(env, ids),
    people: {
      publicId: async (id) => (await peopleOf(env).find(id))?.publicId,
      idOf: (publicId) => peopleOf(env).idOf(publicId),
    },
    ask: botAsker(loadBrand(env.BRAND), (jobs) => notify(env, jobs)),
    alertTeam: async ({ name, publicId }, rating) => {
      const values = {
        name,
        id: publicId,
        average: formatNumber(rating.average ?? 0),
        count: rating.count,
      };
      await tellOwners(env, { id: `rating:${publicId}`, text: t('bot.rating.team', values), ring: false });
    },
    mask: (text) => maskContacts(text).text,
    now: Date.now,
    newId: () => crypto.randomUUID(),
  };
};

export const ratingsModule = reviewRoutes(ratingsDeps);

// The Cron job: ask both sides of rides that ended, remind once (docs/24).
export const askForRatings = (env: Bindings) => askRatings(ratingsDeps(env));

// A press of 1 … 5 in the bot (bots/rating-callbacks.ts).
export const rateFromBot = (env: Bindings, raterId: number, bookingId: string, stars: number) =>
  rate(ratingsDeps(env), raterId, { bookingId, stars, tags: [], text: '' }, true);

// "⭐ 4,8 (37)" of drivers: the trip search and the channel posts (docs/24, docs/54).
export const ratingsOfPeople = (env: Bindings, ids: readonly number[]) => ratingsOf(ratingsDeps(env), ids);
export { COMPLAIN_PARAM, RATE_PREFIX, REVIEW_PARAM } from './infrastructure/bot-asker';

// "Safarlar tarixi" (G18): the stars given and the published stars got, per booking.
export const starsOf = (env: Bindings, userId: number) => starsOfRides(ratingsDeps(env), userId);

// The rating and «vaqtida» on top of «Profil» (G65).
export const reviewStandingOf = (env: Bindings, userId: number) => standingOf(ratingsDeps(env), userId);

// "Maʼlumotlarimni oʻchirish": a new account of the same person starts without old reviews (docs/65 A5).
export const forgetRatings = (env: Bindings, userId: number) => ratingsDeps(env).store.forget(userId);
