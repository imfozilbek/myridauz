import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { readAvatar } from '../application/avatar';
import type { UsersDeps } from '../application/ports';
import { getPublicProfile } from '../application/profile';
import { callerOf, fail } from './respond';

// Short private cache: the photo is personal data, shared caches must not keep it (docs/30).
const AVATAR_CACHE = 'private, max-age=300';

export function userRoutes(deps: (env: Bindings) => UsersDeps) {
  // The path carries the public id (docs/65 A3); 0 is nobody.
  const ownerOf = async (context: Context<AppEnv>) =>
    (await deps(context.env).users.byPublicId(context.req.param('id') ?? ''))?.id ?? 0;
  return new Hono<AppEnv>()
    .get('/users/:id{[0-9a-f]+}', async (context) => {
      const result = await getPublicProfile(deps(context.env), await ownerOf(context));
      return result.ok ? context.json(result.profile) : fail(context, result.error);
    })
    .get('/users/:id{[0-9a-f]+}/avatar', async (context) => {
      const result = await readAvatar(deps(context.env), callerOf(context), await ownerOf(context));
      if (!result.ok) return fail(context, result.error);
      return context.body(result.image.body, 200, {
        'content-type': result.image.type,
        'cache-control': AVATAR_CACHE,
      });
    });
}
