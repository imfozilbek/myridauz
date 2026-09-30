import { REVIEWS_PATH, reviewInputSchema, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { RatingsDeps } from '../application/ports';
import { rate, reviewTarget } from '../application/rate';
import { reviewsOf } from '../application/read';

const STATUS = {
  'reviews.not_found': 404,
  'reviews.not_over': 409,
  'reviews.too_late': 409,
  'reviews.invalid_input': 400,
  'auth.not_admin': 403,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });

// Reviews after a ride (docs/24): the review screen, sending a review, a person's published reviews,
// and hiding a review by the team.
export const reviewRoutes = (deps: (env: Bindings) => RatingsDeps) =>
  new Hono<AppEnv>()
    .get(`${REVIEWS_PATH}/:bookingId`, async (context) => {
      const userId = context.get('session').user.id;
      const target = await reviewTarget(deps(context.env), userId, context.req.param('bookingId'));
      return typeof target === 'string' ? fail(target) : context.json(target);
    })
    .post(REVIEWS_PATH, async (context) => {
      const input = reviewInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail('reviews.invalid_input');
      const result = await rate(deps(context.env), context.get('session').user.id, input.data);
      return result === 'ok' ? context.body(null, 204) : fail(result);
    })
    .get('/users/:id/reviews', async (context) => {
      const userId = await deps(context.env).people.idOf(context.req.param('id'));
      if (userId === undefined) return fail('reviews.not_found');
      return context.json(await reviewsOf(deps(context.env), userId));
    })
    .post('/admin/reviews/:id/hide', async (context) => {
      if (!context.get('session').isAdmin) return fail('auth.not_admin');
      const hidden = await deps(context.env).store.hide(context.req.param('id'));
      return hidden ? context.body(null, 204) : fail('reviews.not_found');
    });
