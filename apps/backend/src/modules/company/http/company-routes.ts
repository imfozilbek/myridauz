import { ADMIN_COMPANY_PATH, companySchema, PUBLIC_COMPANY_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { companyState, publicCompany, saveCompany } from '../application/company';
import type { CompanyDeps } from '../application/ports';

const BAD_REQUEST = 400;
const FORBIDDEN = 403;
// The owner wants a change in the documents seen fast: a minute of cache at most (G34).
const PUBLIC_CACHE = 'public, max-age=60';

// The requisites for everyone without a signature; the admin screen and the save for the team.
export function companyRoutes(deps: (env: Bindings) => CompanyDeps) {
  return new Hono<AppEnv>()
    .get(PUBLIC_COMPANY_PATH, async (context) => {
      context.header('cache-control', PUBLIC_CACHE);
      return context.json(await publicCompany(deps(context.env)));
    })
    .use(ADMIN_COMPANY_PATH, async (context, next) =>
      context.get('session').isAdmin ? next() : context.json({ error: 'auth.not_admin' }, FORBIDDEN),
    )
    .get(ADMIN_COMPANY_PATH, async (context) => {
      const canEdit = context.get('session').teamRole === 'owner';
      return context.json(await companyState(deps(context.env), canEdit));
    })
    .post(ADMIN_COMPANY_PATH, ownerOnly, async (context) => {
      const input = companySchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return context.json({ error: 'company.invalid_input' }, BAD_REQUEST);
      const by = context.get('session').user.id;
      return context.json(await saveCompany(deps(context.env), input.data, by));
    });
}
