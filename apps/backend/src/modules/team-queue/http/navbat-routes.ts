import {
  ADMIN_NAVBAT_PATH,
  MINUTE_MS,
  NAVBAT_KINDS,
  TAKE_MINUTES,
  type NavbatKind,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { teamOnly } from '../../../shared/auth/team-only';
import type { TakeStore } from '../application/takes';
import { queueOf, waitedMinutes, type Case } from '../domain/queue';
import { brandOf } from '../../../shared/brand/brand-of';

type NavbatDeps = {
  readonly cases: (env: Bindings) => Promise<Case[]>;
  readonly takes: (env: Bindings) => TakeStore;
  readonly name: (env: Bindings, memberId: number) => Promise<string | null>;
};
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const MAX_ID = 64;
const isKind = (kind: string): kind is NavbatKind => (NAVBAT_KINDS as readonly string[]).includes(kind);

// «Navbat» in the admin app (G75, docs/120): the cases of the bot card, the oldest first, red over
// the limit of the owner, and who of the others opened each case in the last minutes.
export const navbatRoutes = ({ cases, takes, name }: NavbatDeps) =>
  new Hono<AppEnv>()
    .get(ADMIN_NAVBAT_PATH, teamOnly, async (context) => {
      const { env } = context;
      const { hours, ownerMinutes } = brandOf(env).moderation;
      const now = Date.now();
      const viewer = context.get('session').user.id;
      const [all, opened] = await Promise.all([cases(env), takes(env).fresh(now - TAKE_MINUTES * MINUTE_MS)]);
      const others = opened.filter((take) => take.memberId !== viewer);
      const names = new Map(
        await Promise.all(
          others.map(async (take) => [`${take.kind}:${take.id}`, await name(env, take.memberId)] as const),
        ),
      );
      const items = [...all]
        .sort((a, b) => a.since - b.since)
        .map((item) => {
          const minutes = waitedMinutes(item, now, hours);
          const takenBy = names.get(`${item.kind}:${item.id}`) ?? null;
          return { ...item, minutes, late: minutes >= ownerMinutes, takenBy };
        });
      return context.json({ items, counts: queueOf(all, now, hours).counts });
    })
    .post(`${ADMIN_NAVBAT_PATH}/:kind/:id/take`, teamOnly, async (context) => {
      const { kind = '', id = '' } = context.req.param();
      if (!isKind(kind) || id.length > MAX_ID)
        return context.json({ error: 'team.invalid_input' }, BAD_REQUEST);
      await takes(context.env).take({ kind, id, memberId: context.get('session').user.id }, Date.now());
      return context.body(null, NO_CONTENT);
    });
