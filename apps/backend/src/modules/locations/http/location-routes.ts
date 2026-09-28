import {
  distanceQuerySchema,
  LOCATION_DISTANCE_PATH,
  LOCATIONS_PATH,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { Directory } from '../application/directory';
import { getDistance, updateDistance } from '../application/distance';
import type { LocationsDeps } from '../application/ports';

const STATUS = {
  'locations.not_found': 404,
  'locations.invalid_input': 400,
  'locations.same_place': 422,
  'locations.inside_city': 422,
  'auth.not_admin': 403,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const NOT_MODIFIED = 304;
const LOCALE = 'uz-Latn';
// Public data without personal fields: browsers and Cloudflare may keep it for an hour (docs/48).
const DIRECTORY_CACHE = 'public, max-age=3600, stale-while-revalidate=86400';

type Wiring = {
  readonly deps: (env: Bindings) => LocationsDeps;
  readonly directory: Directory;
  // Only a change of a distance needs the Telegram signature (shared/auth).
  readonly auth: MiddlewareHandler<AppEnv>;
};

export function locationRoutes({ deps, directory, auth }: Wiring) {
  return new Hono<AppEnv>()
    .get(LOCATIONS_PATH, async (context) => {
      const response = await directory(deps(context.env), LOCALE);
      const etag = `"${response.version}"`;
      const headers = { etag, 'cache-control': DIRECTORY_CACHE };
      if (context.req.header('if-none-match') === etag) return context.body(null, NOT_MODIFIED, headers);
      return context.json(response, 200, headers);
    })
    .get(LOCATION_DISTANCE_PATH, async (context) => {
      const query = distanceQuerySchema.safeParse(context.req.query());
      if (!query.success)
        return context.json({ error: 'locations.invalid_input' }, STATUS['locations.invalid_input']);
      const result = await getDistance(deps(context.env), directory, query.data.from, query.data.to);
      return result.ok
        ? context.json(result.value)
        : context.json({ error: result.error }, STATUS[result.error]);
    })
    .put(LOCATION_DISTANCE_PATH, auth, async (context) => {
      const input = distanceSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success)
        return context.json({ error: 'locations.invalid_input' }, STATUS['locations.invalid_input']);
      const caller = { isAdmin: context.get('session').isAdmin };
      const result = await updateDistance(deps(context.env), directory, caller, input.data);
      return result.ok
        ? context.json(result.value)
        : context.json({ error: result.error }, STATUS[result.error]);
    });
}
