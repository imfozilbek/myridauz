import {
  WAITLIST_INVITE_PATH,
  WAITLIST_PATH,
  waitlistInviteSchema,
  waitlistOpenSchema,
  waitlistSaveSchema,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { invite, type InviteDeps } from '../application/invite';
import { openApp, saveAnswers, type PersonDeps } from '../application/person';

import { withDeps } from './with-deps';

const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
type Deps = (env: Bindings) => (PersonDeps & Omit<InviteDeps, 'records' | 'visits' | 'now'>) | null;
type Platform = (client: string | undefined) => string | null;

// The questionnaire of the main bot (G83, docs/181): open, save the answers, invite a friend.
export const personRoutes = (deps: Deps, platformOf: Platform) =>
  new Hono<AppEnv>()
    .get(
      WAITLIST_PATH,
      withDeps(deps, async (context, found) => {
        const query = waitlistOpenSchema.safeParse({
          via: context.req.query('via'),
          client: context.req.query('client'),
        });
        const { via, client } = query.success ? query.data : {};
        const userId = context.get('session').user.id;
        return context.json(await openApp(found, userId, via ?? null, platformOf(client)));
      }),
    )
    .put(
      WAITLIST_PATH,
      withDeps(deps, async (context, found) => {
        const input = waitlistSaveSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        const me = await saveAnswers(found, context.get('session').user.id, input.data);
        return me ? context.json(me) : context.json({ error: 'waitlist.closed' }, CONFLICT);
      }),
    )
    .post(
      WAITLIST_INVITE_PATH,
      withDeps(deps, async (context, found) => {
        const input = waitlistInviteSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        const invited = await invite(found, context.get('session').user.id, input.data.role);
        return invited ? context.json(invited) : context.json({ error: 'waitlist.not_found' }, NOT_FOUND);
      }),
    );
