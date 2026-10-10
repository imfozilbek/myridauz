import { ADMIN_SUPPORT_PATH, supportAnswerSchema } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { teamOnly } from '../../../shared/auth/team-only';
import { answerCase, supportCase, type SupportCaseDeps } from '../application/support-case';

const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const NOT_SENT = 502;
const ONE = `${ADMIN_SUPPORT_PATH}/:id{[0-9a-f]+}`;

// A question of support in «Navbat» (G75, docs/158 К): any member of the team reads and answers.
export const supportRoutes = (deps: (env: Bindings) => SupportCaseDeps) =>
  new Hono<AppEnv>()
    .use(`${ADMIN_SUPPORT_PATH}/*`, teamOnly)
    .get(ONE, async (context) => {
      const found = await supportCase(deps(context.env), context.req.param('id'));
      return found ? context.json(found) : context.json({ error: 'support.not_found' }, NOT_FOUND);
    })
    .post(`${ONE}/answer`, async (context) => {
      const input = supportAnswerSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return context.json({ error: 'support.invalid_input' }, BAD_REQUEST);
      const { id, firstName } = context.get('session').user;
      const result = await answerCase(deps(context.env), context.req.param('id'), input.data.text, {
        id,
        name: firstName,
      });
      if (result === 'ok') return context.body(null, 204);
      return context.json({ error: result }, result === 'support.not_found' ? NOT_FOUND : NOT_SENT);
    });
