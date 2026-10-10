import { ADMIN_CHANNEL_HEALTH_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import { channelHealth, type HealthDeps } from '../application/health';

// «Kanallar» of «Boshqaruv» (G75, docs/120): the owner only, as the rest of «Boshqaruv».
export const healthRoutes = (deps: (env: Bindings) => Promise<HealthDeps>) =>
  new Hono<AppEnv>()
    .use(ADMIN_CHANNEL_HEALTH_PATH, teamOnly, ownerOnly)
    .get(ADMIN_CHANNEL_HEALTH_PATH, async (context) =>
      context.json(await channelHealth(await deps(context.env))),
    );
