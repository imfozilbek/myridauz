import {
  ADMIN_AD_LINKS_PATH,
  ADMIN_WAITLIST_SWITCH_PATH,
  AD_CODE,
  adLinkInputSchema,
  waitlistSwitchInputSchema,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import { createAd, listAds, oneAd, readSwitch, setSwitch, type AdDeps } from '../application/ads';
import { withDeps } from './with-deps';

const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const NOT_FOUND = 404;

// «Kutish roʻyxati» of «Boshqaruv» (docs/181, docs/184): the switch is the owner's; the ad links are the
// whole team's (owner, 17.10.2026).
export const adRoutes = (deps: (env: Bindings) => AdDeps | null) =>
  new Hono<AppEnv>()
    .use(ADMIN_WAITLIST_SWITCH_PATH, teamOnly, ownerOnly)
    .use(ADMIN_AD_LINKS_PATH, teamOnly)
    .use(`${ADMIN_AD_LINKS_PATH}/*`, teamOnly)
    .get(
      ADMIN_WAITLIST_SWITCH_PATH,
      withDeps(deps, async (context, found) => context.json(await readSwitch(found))),
    )
    .put(
      ADMIN_WAITLIST_SWITCH_PATH,
      withDeps(deps, async (context, found) => {
        const input = waitlistSwitchInputSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        return context.json(await setSwitch(found, input.data.open, context.get('session').user.id));
      }),
    )
    .get(
      ADMIN_AD_LINKS_PATH,
      withDeps(deps, async (context, found) => context.json({ links: await listAds(found) })),
    )
    .post(
      ADMIN_AD_LINKS_PATH,
      withDeps(deps, async (context, found) => {
        const input = adLinkInputSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        const made = await createAd(found, input.data, context.get('session').user.id);
        if (made === 'invalid') return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        if (made === 'not_admin') return context.json({ error: 'channels.bot_not_admin' }, FORBIDDEN);
        return context.json(made);
      }),
    )
    .get(
      `${ADMIN_AD_LINKS_PATH}/:code`,
      withDeps(deps, async (context, found) => {
        const code = context.req.param('code') ?? '';
        const ad = AD_CODE.test(code) ? await oneAd(found, code) : null;
        return ad ? context.json(ad) : context.json({ error: 'waitlist.not_found' }, NOT_FOUND);
      }),
    );
