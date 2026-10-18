import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { brandOf } from '../../../shared/brand/brand-of';
import { profileLink } from '../../../shared/telegram/profile-link';
import type { UsersDeps } from '../application/ports';
import { fail } from './respond';

const ONE = '/admin/people/:id{[0-9a-f]+}/telegram';

// The Telegram account of a person, for the checks of the team only (owner, 17.10.2026): the public
// name and the link to the profile through the bot the person knows (18.10.2026), never to other
// people (docs/07).
export function telegramRoutes(deps: (env: Bindings) => UsersDeps) {
  return new Hono<AppEnv>().get(ONE, async (context) => {
    if (!context.get('session').isAdmin) return fail(context, 'auth.not_admin');
    const usersDeps = deps(context.env);
    const user = await usersDeps.users.byPublicId(context.req.param('id') ?? '');
    if (!user) return fail(context, 'users.not_found');
    const seen = await usersDeps.names.find(user.id);
    return context.json({
      username: seen?.username ?? null,
      profileLink: profileLink(brandOf(context.env), seen?.bot ?? 'passenger', user.publicId),
    });
  });
}
