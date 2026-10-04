import {
  ADMIN_APPLICATIONS_PATH,
  ADMIN_ME_PATH,
  CAR_PHOTO_KINDS,
  decisionSchema,
  type CarPhotoKind,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { applicantPhoto, applicationFor, decideApplication, queue } from '../application/moderate';
import type { DriversDeps } from '../application/ports';
import { fail, image } from './respond';

const ONE = `${ADMIN_APPLICATIONS_PATH}/:id{[0-9a-f]+}`;
const isPhoto = (value: string): value is CarPhotoKind | 'avatar' =>
  value === 'avatar' || (CAR_PHOTO_KINDS as readonly string[]).includes(value);

// Only the team sees applications and decides (docs/02, docs/04).
export function adminRoutes(deps: (env: Bindings) => DriversDeps) {
  // The path carries the public id (docs/65 A3); 0 is nobody.
  const userOf = async (context: Context<AppEnv>) =>
    (await deps(context.env).people.idOf(context.req.param('id') ?? '')) ?? 0;
  return (
    new Hono<AppEnv>()
      .use('/admin/*', async (context, next) =>
        context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
      )
      // The name and the role of the team member on the main screen (G53).
      .get(ADMIN_ME_PATH, (context) => {
        const { user, teamRole } = context.get('session');
        return teamRole
          ? context.json({ firstName: user.firstName, role: teamRole })
          : fail(context, 'auth.not_admin');
      })
      .get(ADMIN_APPLICATIONS_PATH, async (context) =>
        context.json({ applications: await queue(deps(context.env)) }),
      )
      .get(ONE, async (context) => {
        const found = await applicationFor(deps(context.env), await userOf(context));
        return found ? context.json(found) : fail(context, 'drivers.not_found');
      })
      .get(`${ONE}/photos/:kind`, async (context) => {
        const kind = context.req.param('kind');
        if (!isPhoto(kind)) return fail(context, 'drivers.invalid_input');
        return image(context, await applicantPhoto(deps(context.env), await userOf(context), kind));
      })
      .post(`${ONE}/decision`, async (context) => {
        const decision = decisionSchema.safeParse(await context.req.json().catch(() => null));
        if (!decision.success) return fail(context, 'drivers.invalid_input');
        const moderator = context.get('session').user.id;
        const userId = await userOf(context);
        const result = await decideApplication(deps(context.env), moderator, userId, decision.data);
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
  );
}
