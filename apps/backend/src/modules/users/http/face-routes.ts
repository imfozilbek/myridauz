import { ADMIN_FACES_PATH, faceDecisionSchema } from '@platform/contracts';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { decideFace, facePhoto, pendingFaces } from '../application/faces';
import type { UsersDeps } from '../application/ports';
import { fail } from './respond';

const ONE = `${ADMIN_FACES_PATH}/:id{[0-9a-f]+}`;
const NO_CONTENT = 204;
// Personal photos: a short private cache only (docs/30).
const PHOTO_CACHE = 'private, max-age=300';
const teamOnly: MiddlewareHandler<AppEnv> = async (context, next) =>
  context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin');

// The team checks new face photos in the admin Mini App (docs/120, G51); the admin bot does the
// same with the buttons of the card.
export function faceRoutes(deps: (env: Bindings) => UsersDeps) {
  // The path carries the public id (docs/65 A3); 0 is nobody.
  const userOf = async (context: Context<AppEnv>) =>
    (await deps(context.env).users.byPublicId(context.req.param('id') ?? ''))?.id ?? 0;
  return new Hono<AppEnv>()
    .use(ADMIN_FACES_PATH, teamOnly)
    .use(`${ADMIN_FACES_PATH}/*`, teamOnly)
    .get(ADMIN_FACES_PATH, async (context) => context.json({ faces: await pendingFaces(deps(context.env)) }))
    .get(`${ONE}/photo`, async (context) => {
      const photo = await facePhoto(deps(context.env), await userOf(context));
      if (!photo) return fail(context, 'users.not_found');
      return context.body(photo.body, 200, { 'content-type': photo.type, 'cache-control': PHOTO_CACHE });
    })
    .post(`${ONE}/decision`, async (context) => {
      const decision = faceDecisionSchema.safeParse(await context.req.json().catch(() => null));
      if (!decision.success) return fail(context, 'users.invalid_input');
      const moderator = context.get('session').user.id;
      const userId = await userOf(context);
      const result = await decideFace(deps(context.env), moderator, userId, decision.data);
      return result.ok ? context.body(null, NO_CONTENT) : fail(context, result.error);
    });
}
