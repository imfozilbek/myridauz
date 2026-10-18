import { type PersonActivity, type PersonCard } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';

// What «Odamlar» reads of a person from the modules that hold it (wired in index.ts).
export type PersonSources = {
  readonly idOf: (env: Bindings, publicId: string) => Promise<number | undefined>;
  readonly card: (env: Bindings, userId: number, publicId: string) => Promise<PersonCard | undefined>;
  readonly activity: (env: Bindings, userId: number) => Promise<PersonActivity>;
};
const NOT_FOUND = 404;
const ONE = '/admin/people/:id{[0-9a-f]+}';

// «Odamlar» (G75, docs/120): the owner opens a person by the public id; a moderator does not. What
// the person did lately comes apart, so the card opens at once (G45).
export const personRoutes = ({ idOf, card, activity }: PersonSources) =>
  new Hono<AppEnv>()
    .get(ONE, teamOnly, ownerOnly, async (context) => {
      const publicId = context.req.param('id');
      const userId = await idOf(context.env, publicId);
      const found = userId === undefined ? undefined : await card(context.env, userId, publicId);
      return found ? context.json(found) : context.json({ error: 'users.not_found' }, NOT_FOUND);
    })
    .get(`${ONE}/activity`, teamOnly, ownerOnly, async (context) => {
      const userId = await idOf(context.env, context.req.param('id'));
      if (userId === undefined) return context.json({ error: 'users.not_found' }, NOT_FOUND);
      return context.json(await activity(context.env, userId));
    });
