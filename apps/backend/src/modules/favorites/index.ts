import type { Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { showNews } from '../notifications';
import { peopleOf } from '../users';
import { tellFans } from './application/favorites';
import type { FavoritesDeps } from './application/ports';
import { favoriteRoutes } from './http/favorite-routes';
import { favoriteTeller } from './infrastructure/bot-teller';
import { createMemoryFavorites, d1Favorites } from './infrastructure/favorite-store';
import { brandOf } from '../../shared/brand/brand-of';

const localFavorites = createMemoryFavorites();

// Drivers and their trips come from other modules, set by the app (module-events.ts).
type Sources = {
  readonly driver: (env: Bindings, id: number) => ReturnType<FavoritesDeps['driver']>;
  readonly upcoming: (env: Bindings, driverIds: readonly number[]) => Promise<Trip[]>;
};
let sources: Sources = { driver: async () => undefined, upcoming: async () => [] };
export const wireFavorites = (next: Sources) => void (sources = next);

const favoritesDeps = (env: Bindings): FavoritesDeps => ({
  store: env.DB ? d1Favorites(env.DB) : localFavorites,
  driver: (id) => sources.driver(env, id),
  upcoming: (ids) => sources.upcoming(env, ids),
  tell: favoriteTeller({
    brand: brandOf(env),
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
    show: (news) => showNews(env, news),
    now: Date.now,
  }),
  idOf: (publicId) => peopleOf(env).idOf(publicId),
  now: Date.now,
});

export const favoritesModule = favoriteRoutes(favoritesDeps);

// A new trip: the passengers who saved its driver hear about it (docs/18).
export const tellFavoriteFans = (env: Bindings, trip: Trip) => tellFans(favoritesDeps(env), trip);

// A deleted account (docs/30): its saved drivers and its place in others' lists go.
export const forgetFavorites = (env: Bindings, userId: number) => favoritesDeps(env).store.forget(userId);
