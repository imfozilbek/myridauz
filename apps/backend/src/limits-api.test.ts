import {
  ADMIN_JOURNAL_PATH,
  ADMIN_LIMITS_PATH,
  adminLimitPath,
  journalSchema,
  limitsSchema,
} from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { changeModerator } from './modules/team';
import { brandOf } from './shared/brand/brand-of';
import { call, registerUser, testEnv } from './test-api';

const OWNER = 900;
const MODERATOR = 954;
const team = { app: 'admin' };
const put = (value: unknown) => ({
  ...team,
  method: 'PUT',
  body: JSON.stringify({ value }),
  headers: { 'content-type': 'application/json' },
});
const read = async () => limitsSchema.parse(await (await call(ADMIN_LIMITS_PATH, OWNER, team)).json());

// «Cheklovlar» (G75, docs/128 §4): the defaults come from the brand config; the owner changes a limit
// within its rule; the change has its history and the server reads it at once.
describe('«Cheklovlar»', () => {
  it('shows every limit with its default, and a change reaches the rules of the server', async () => {
    await registerUser(OWNER);
    const before = await read();
    expect(before.limits).toContainEqual({ key: 'schedule.maxActiveTrips', value: 3, base: 3 });
    const changed = limitsSchema.parse(
      await (await call(adminLimitPath('schedule.maxActiveTrips'), OWNER, put(2))).json(),
    );
    expect(changed.limits).toContainEqual({ key: 'schedule.maxActiveTrips', value: 2, base: 3 });
    expect(changed.history[0]).toMatchObject({
      key: 'schedule.maxActiveTrips',
      before: 3,
      after: 2,
      by: 'Ali',
    });
    expect(brandOf({}).schedule.maxActiveTrips).toBe(2);
    const journal = journalSchema.parse(await (await call(ADMIN_JOURNAL_PATH, OWNER, team)).json());
    expect(journal.entries[0]).toMatchObject({
      kind: 'limits',
      subject: 'schedule.maxActiveTrips',
      action: '2',
    });
  });

  it('refuses a value out of its rule and team hours that close before they open', async () => {
    expect((await call(adminLimitPath('schedule.maxActiveTrips'), OWNER, put(0))).status).toBe(400);
    expect((await call(adminLimitPath('schedule.maxActiveTrips'), OWNER, put(2.5))).status).toBe(400);
    expect((await call(adminLimitPath('moderation.hours.from'), OWNER, put(23))).status).toBe(400);
    expect((await call(`${ADMIN_LIMITS_PATH}/sizes.photo`, OWNER, put(1))).status).toBe(400);
  });

  it("is the owner's only", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    expect((await call(ADMIN_LIMITS_PATH, MODERATOR, team)).status).toBe(403);
    expect((await call(adminLimitPath('promo.amount'), MODERATOR, put(1))).status).toBe(403);
  });
});
