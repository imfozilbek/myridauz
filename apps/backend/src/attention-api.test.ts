import { ADMIN_ATTENTION_PATH, attentionSchema } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { tellOwners } from './modules/team-queue';
import { changeModerator } from './modules/team';
import { call, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const OWNER = 900;
const MODERATOR = 908;
const PERSON = 'a'.repeat(32);
// 2026-10-12 and the next day, 10:00 in Tashkent.
const DAY = Date.parse('2026-10-12T05:00:00Z');
const NEXT_DAY = DAY + 24 * 60 * 60 * 1000;
const read = async (id: number) => call(ADMIN_ATTENTION_PATH, id, { app: 'admin' });

// «Diqqat» is one list for the bot and the app (G75, docs/120, docs/122): what the card says, the
// owner reads in the app with its data, to open the person or the screen behind the sign.
describe('«Diqqat» in the admin app', () => {
  it('gives the owner the signs of today, a sign of the same id replaced by the last', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: DAY });
    const money = (seats: number) => ({ kind: 'money' as const, name: 'Jasur', person: PERSON, seats });
    await tellOwners(testEnv, { id: `money:${PERSON}`, text: 'Jasur 4', ring: false, sign: money(4) });
    await tellOwners(testEnv, {
      id: 'errors',
      text: 'Xatolar',
      ring: true,
      sign: { kind: 'errors', hour: 9, usual: 1 },
    });
    await tellOwners(testEnv, { id: `money:${PERSON}`, text: 'Jasur 2', ring: false, sign: money(2) });
    const today = attentionSchema.parse(await (await read(OWNER)).json());
    expect(today.signs.map((item) => item.sign)).toEqual([money(2), { kind: 'errors', hour: 9, usual: 1 }]);
    vi.setSystemTime(NEXT_DAY);
    expect(attentionSchema.parse(await (await read(OWNER)).json()).signs).toEqual([]);
  });

  it("is the owner's only: a moderator has no «Diqqat» (docs/120)", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const refused = await read(MODERATOR);
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
  });
});
