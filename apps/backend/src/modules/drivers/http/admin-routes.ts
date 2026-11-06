import {
  ADMIN_APPLICATIONS_PATH,
  ADMIN_ME_PATH,
  ADMIN_MY_DECISIONS_PATH,
  CAR_PHOTO_KINDS,
  carFixSchema,
  decisionSchema,
  type CarPhotoKind,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { applicantPhoto, applicationFor, decideApplication, queue } from '../application/moderate';
import type { DriversDeps } from '../application/ports';
import { fail, image } from './respond';
import { recordAction } from '../../journal';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { fixApprovedCar, myDecisions, reopenRejected } from '../application/fixes';

const ONE = `${ADMIN_APPLICATIONS_PATH}/:id{[0-9a-f]+}`;
const NO_CONTENT = 204;
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
      .get(ADMIN_ME_PATH, async (context) => {
        const { user, teamRole } = context.get('session');
        if (!teamRole) return fail(context, 'auth.not_admin');
        const person = await deps(context.env).people.find(user.id);
        const id = person?.publicId ?? null;
        const hasAvatar = Boolean(person?.avatarKey);
        return context.json({
          id,
          firstName: person?.firstName ?? user.firstName,
          hasAvatar,
          role: teamRole,
        });
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
        if (!result.ok) return fail(context, result.error);
        const { submittedAt } = result.value;
        const subject = context.req.param('id') ?? '';
        const action = { memberId: moderator, kind: 'application' as const, subject, since: submittedAt };
        await recordAction(context.env, { ...action, action: decision.data.action });
        return context.json(result.value);
      })
      // «Mening qarorlarim», «Mashinani tuzatish» and the owner's «Rad etishni bekor qilish» (G95).
      .get(ADMIN_MY_DECISIONS_PATH, async (context) =>
        context.json({ decisions: await myDecisions(deps(context.env), context.get('session').user.id) }),
      )
      .post(`${ONE}/car`, async (context) => {
        const car = carFixSchema.safeParse(await context.req.json().catch(() => null));
        if (!car.success) return fail(context, 'drivers.invalid_input');
        const member = context.get('session').user.id;
        const env = deps(context.env);
        const userId = await userOf(context);
        const was = (await env.applications.find(userId))?.car?.plate;
        const result = await fixApprovedCar(env, member, userId, car.data);
        if (!result.ok) return fail(context, result.error);
        // «было → стало» of the plate in «Jurnal», when the plate is what changed.
        const plates = was && was !== car.data.plate ? `:${was}:${car.data.plate}` : '';
        const subject = context.req.param('id') ?? '';
        const action = { memberId: member, kind: 'application' as const, subject, since: null };
        await recordAction(context.env, { ...action, action: `car${plates}` });
        return context.json(result.value);
      })
      .post(`${ONE}/reopen`, ownerOnly, async (context) => {
        const owner = context.get('session').user.id;
        const result = await reopenRejected(deps(context.env), owner, await userOf(context));
        if (!result.ok) return fail(context, result.error);
        const subject = context.req.param('id') ?? '';
        const action = { memberId: owner, kind: 'application' as const, subject, since: null };
        await recordAction(context.env, { ...action, action: 'reopen' });
        return context.body(null, NO_CONTENT);
      })
  );
}
