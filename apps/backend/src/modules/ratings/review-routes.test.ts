import { adminReviewsSchema } from '@platform/contracts';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from '../../env';
import { rate } from './application/rate';
import { reviewsOf } from './application/read';
import { reviewRoutes } from './http/review-routes';
import { DRIVER, review, ride, setup } from './ratings-test-kit';
import { publicIdOf } from '../../test-people';

const PASSENGER = 101;
const serve = (deps: ReturnType<typeof setup>['deps'], isAdmin: boolean) =>
  new Hono<AppEnv>()
    .use(async (context, next) => {
      context.set('session', { user: { id: PASSENGER }, isAdmin } as AppEnv['Variables']['session']);
      await next();
    })
    .route(
      '/',
      reviewRoutes(() => deps),
    );
const hide = (app: ReturnType<typeof serve>, id: string) =>
  app.request(`/admin/reviews/${id}/hide`, { method: 'POST' });

// «Yashirish» of a review (docs/24, docs/79 T29): only the team hides one; a hidden review is not shown.
describe('hiding a review', () => {
  it('lets the team hide a published review, never a person', async () => {
    const { deps } = setup();
    await rate(deps, PASSENGER, review('b1', 1, 'Yomon'));
    await rate(deps, DRIVER, review('b1', 5));
    const [shown] = (await reviewsOf(deps, DRIVER)).reviews;
    const id = shown?.id ?? '';
    const person = await hide(serve(deps, false), id);
    expect([person.status, await person.json()]).toEqual([403, { error: 'auth.not_admin' }]);
    expect((await reviewsOf(deps, DRIVER)).reviews).toHaveLength(1);
    expect((await hide(serve(deps, true), id)).status).toBe(204);
    expect((await reviewsOf(deps, DRIVER)).reviews).toEqual([]);
    const unknown = await hide(serve(deps, true), 'none');
    expect([unknown.status, await unknown.json()]).toEqual([404, { error: 'reviews.not_found' }]);
  });

  // «Sharhlar» (G45): every review for the team, the blind one too, with who wrote it about whom.
  it('lists the reviews for the team only, the newest first, with the hidden mark', async () => {
    const { deps, later } = setup([ride(1), ride(2)]);
    await rate(deps, PASSENGER, review('b1', 1, 'Yomon'));
    later(1000);
    await rate(deps, 102, review('b2', 5));
    const list = async (isAdmin: boolean, query = '') =>
      serve(deps, isAdmin).request(`/admin/reviews${query}`);
    expect((await list(false)).status).toBe(403);
    const page = adminReviewsSchema.parse(await (await list(true)).json());
    expect(page.more).toBe(false);
    expect(page.reviews.map((item) => [item.stars, item.author.firstName, item.about.firstName])).toEqual([
      [5, 'P102', 'Jasur'],
      [1, 'P101', 'Jasur'],
    ]);
    expect(page.reviews[1]?.about.id).toBe(publicIdOf(DRIVER));
    await hide(serve(deps, true), page.reviews[1]?.id ?? '');
    const after = adminReviewsSchema.parse(await (await list(true)).json());
    expect(after.reviews.map((item) => item.hidden)).toEqual([false, true]);
    const older = adminReviewsSchema.parse(await (await list(true, `?before=${page.reviews[0]?.at}`)).json());
    expect(older.reviews.map((item) => item.stars)).toEqual([1]);
  });
});
