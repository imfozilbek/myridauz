import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { readAvatar } from '../application/avatar';
import type { UsersDeps } from '../application/ports';
import { getPublicProfile } from '../application/profile';
import { callerOf, fail } from './respond';

// Short private cache: the photo is personal data, shared caches must not keep it (docs/30).
const AVATAR_CACHE = 'private, max-age=300';

export function userRoutes(deps: (env: Bindings) => UsersDeps) {
  return new Hono<AppEnv>()
    .get('/users/:id{[0-9]+}', async (context) => {
      const result = await getPublicProfile(deps(context.env), Number(context.req.param('id')));
      return result.ok ? context.json(result.profile) : fail(context, result.error);
    })
    .get('/users/:id{[0-9]+}/avatar', async (context) => {
      const result = await readAvatar(deps(context.env), callerOf(context), Number(context.req.param('id')));
      if (!result.ok) return fail(context, result.error);
      return context.body(result.image.body, 200, {
        'content-type': result.image.type,
        'cache-control': AVATAR_CACHE,
      });
    });
}
