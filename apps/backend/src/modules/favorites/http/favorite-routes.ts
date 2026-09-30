import { FAVORITES_PATH, type ApiErrorCode } from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { addFavorite, favoritesOf, removeFavorite } from '../application/favorites';
import type { FavoritesDeps } from '../application/ports';

const STATUS = {
  'favorites.not_found': 404,
  'favorites.too_many': 409,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });
const ONE = `${FAVORITES_PATH}/:driverId{[0-9a-f]+}`;

// "Sevimli haydovchilar" of a passenger: the list with trips, save, remove (docs/18).
export function favoriteRoutes(deps: (env: Bindings) => FavoritesDeps) {
  // The path carries the public id (docs/65 A3); 0 is nobody.
  const driverOf = async (context: Context<AppEnv>) =>
    (await deps(context.env).idOf(context.req.param('driverId') ?? '')) ?? 0;
  return new Hono<AppEnv>()
    .get(FAVORITES_PATH, async (context) =>
      context.json(await favoritesOf(deps(context.env), context.get('session').user.id)),
    )
    .put(ONE, async (context) => {
      const driverId = await driverOf(context);
      const result = await addFavorite(deps(context.env), context.get('session').user.id, driverId);
      return result.ok ? context.body(null, 204) : fail(result.error);
    })
    .delete(ONE, async (context) => {
      const driverId = await driverOf(context);
      const removed = await removeFavorite(deps(context.env), context.get('session').user.id, driverId);
      return removed ? context.body(null, 204) : fail('favorites.not_found');
    });
}
