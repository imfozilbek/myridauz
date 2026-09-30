import { loadBrand } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { tellFans } from './application/favorites';
import type { FavoritesDeps } from './application/ports';
import { favoriteRoutes } from './http/favorite-routes';
import { favoriteTeller } from './infrastructure/bot-teller';
import { createMemoryFavorites, d1Favorites } from './infrastructure/favorite-store';

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
    brand: loadBrand(env.BRAND),
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
    send: (jobs) => notify(env, jobs),
  }),
  now: Date.now,
});

export const favoritesModule = favoriteRoutes(favoritesDeps);

// A new trip: the passengers who saved its driver hear about it (docs/18).
export const tellFavoriteFans = (env: Bindings, trip: Trip) => tellFans(favoritesDeps(env), trip);
