import { ADMIN_TEAM_PATH, teamAddSchema } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import type { TeamMember } from '../application/team';

type Person = { readonly publicId: string; readonly firstName: string; readonly avatarShown: boolean };
type TeamDeps = {
  readonly members: (env: Bindings) => Promise<TeamMember[]>;
  readonly change: (env: Bindings, actorId: number, userId: number, add: boolean) => Promise<string>;
  readonly find: (env: Bindings, userId: number) => Promise<Person | undefined>;
  readonly idOf: (env: Bindings, publicId: string) => Promise<number | undefined>;
};
const NO_CONTENT = 204;
const NOT_FOUND = 404;
const BAD_REQUEST = 400;

// «Jamoa» (G75, docs/120): the owner's only. A person is found by the public id; a member who never
// registered has no public id and stays out of the list (docs/65 A3).
export const teamRoutes = ({ members, change, find, idOf }: TeamDeps) => {
  const set = async (env: Bindings, actorId: number, publicId: string, add: boolean) => {
    const userId = await idOf(env, publicId);
    if (userId === undefined) return 'team.not_found';
    return change(env, actorId, userId, add);
  };
  return new Hono<AppEnv>()
    .use(ADMIN_TEAM_PATH, teamOnly, ownerOnly)
    .use(`${ADMIN_TEAM_PATH}/*`, teamOnly, ownerOnly)
    .get(ADMIN_TEAM_PATH, async (context) => {
      const all = await members(context.env);
      const shown = await Promise.all(
        all.map(async ({ id, role }) => {
          const person = await find(context.env, id);
          if (!person) return [];
          const { publicId, firstName, avatarShown } = person;
          return [{ id: publicId, firstName, hasAvatar: avatarShown, role }];
        }),
      );
      return context.json({ members: shown.flat() });
    })
    .post(ADMIN_TEAM_PATH, async (context) => {
      const input = teamAddSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return context.json({ error: 'team.invalid_input' }, BAD_REQUEST);
      const result = await set(context.env, context.get('session').user.id, input.data.person, true);
      return result === 'ok' ? context.body(null, NO_CONTENT) : context.json({ error: result }, NOT_FOUND);
    })
    .delete(`${ADMIN_TEAM_PATH}/:id{[0-9a-f]+}`, async (context) => {
      const result = await set(context.env, context.get('session').user.id, context.req.param('id'), false);
      return result === 'ok' ? context.body(null, NO_CONTENT) : context.json({ error: result }, NOT_FOUND);
    });
};
