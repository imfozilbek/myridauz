import { ADMIN_ATTENTION_PATH, tashkentDate } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import type { SignStore } from '../application/attention';

// «Diqqat» in the admin app (G75, docs/120): the signs of today, the owner's only.
export const attentionRoutes = (signs: (env: Bindings) => SignStore) =>
  new Hono<AppEnv>().get(ADMIN_ATTENTION_PATH, teamOnly, ownerOnly, async (context) =>
    context.json({ signs: await signs(context.env).ofDay(tashkentDate(Date.now())) }),
  );
