import { ADMIN_JOURNAL_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import type { JournalStore } from '../application/ports';

type JournalDeps = {
  readonly store: (env: Bindings) => JournalStore;
  readonly name: (env: Bindings, memberId: number) => Promise<string | null>;
};
const PAGE = 50;

// The journal of the team for the owner (G75): the newest first, a page older than ?before.
export const journalRoutes = ({ store, name }: JournalDeps) =>
  new Hono<AppEnv>().get(ADMIN_JOURNAL_PATH, teamOnly, ownerOnly, async (context) => {
    const before = Number(context.req.query('before') ?? Number.NaN);
    const actions = await store(context.env).recent(Number.isFinite(before) ? before : Date.now() + 1, PAGE);
    const names = new Map<number, string>();
    for (const { memberId } of actions)
      if (!names.has(memberId)) names.set(memberId, (await name(context.env, memberId)) ?? '');
    const entries = actions.map(({ memberId, kind, subject, action, at }) => ({
      member: names.get(memberId) ?? '',
      kind,
      subject,
      action,
      at,
    }));
    return context.json({ entries });
  });
