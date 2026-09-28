import {
  ADMIN_APPLICATIONS_PATH,
  blockSchema,
  CAR_PHOTO_KINDS,
  decisionSchema,
  type CarPhotoKind,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { applicantPhoto, applicationFor, decideApplication, queue } from '../application/moderate';
import type { DriversDeps } from '../application/ports';
import { fail, image } from './respond';

const ONE = `${ADMIN_APPLICATIONS_PATH}/:id{[0-9]+}`;
const NO_CONTENT = 204;
const isPhoto = (value: string): value is CarPhotoKind | 'avatar' =>
  value === 'avatar' || (CAR_PHOTO_KINDS as readonly string[]).includes(value);

// Only the team sees applications and decides (docs/02, docs/04).
export function adminRoutes(deps: (env: Bindings) => DriversDeps) {
  return new Hono<AppEnv>()
    .use('/admin/*', async (context, next) =>
      context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
    )
    .get(ADMIN_APPLICATIONS_PATH, async (context) =>
      context.json({ applications: await queue(deps(context.env)) }),
    )
    .get(ONE, async (context) => {
      const found = await applicationFor(deps(context.env), Number(context.req.param('id')));
      return found ? context.json(found) : fail(context, 'drivers.not_found');
    })
    .get(`${ONE}/photos/:kind`, async (context) => {
      const kind = context.req.param('kind');
      if (!isPhoto(kind)) return fail(context, 'drivers.invalid_input');
      return image(context, await applicantPhoto(deps(context.env), Number(context.req.param('id')), kind));
    })
    .post(`${ONE}/decision`, async (context) => {
      const decision = decisionSchema.safeParse(await context.req.json().catch(() => null));
      if (!decision.success) return fail(context, 'drivers.invalid_input');
      const moderator = context.get('session').user.id;
      const userId = Number(context.req.param('id'));
      const result = await decideApplication(deps(context.env), moderator, userId, decision.data);
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .post('/admin/users/:id{[0-9]+}/block', async (context) => {
      const input = blockSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'drivers.invalid_input');
      await deps(context.env).people.block(Number(context.req.param('id')), input.data.days);
      return context.body(null, NO_CONTENT);
    });
}
