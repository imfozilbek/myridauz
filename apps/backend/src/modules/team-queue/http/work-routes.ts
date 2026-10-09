import { ADMIN_WORK_PATH, tashkentDate, tashkentDayStart } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { teamOnly } from '../../../shared/auth/team-only';
import { actionsOf, workOf } from '../../journal';
import type { Case } from '../domain/queue';
import { brandOf } from '../../../shared/brand/brand-of';

// «Bugun qildingiz · kutmoqda · oʻrtacha · 30 daqiqadan oshgan» of a member (mockup g67/1, G75): the
// own decisions of today from the journal, the cases waiting from «Navbat».
export const workRoutes = (cases: (env: Bindings) => Promise<Case[]>) =>
  new Hono<AppEnv>().get(ADMIN_WORK_PATH, teamOnly, async (context) => {
    const { env } = context;
    const { hours, ownerMinutes } = brandOf(env).moderation;
    const now = Date.now();
    const memberId = context.get('session').user.id;
    const day = tashkentDayStart(tashkentDate(now));
    const [actions, waiting] = await Promise.all([actionsOf(env, memberId, day, now + 1), cases(env)]);
    return context.json({ ...workOf(actions, hours, ownerMinutes), waiting: waiting.length });
  });
