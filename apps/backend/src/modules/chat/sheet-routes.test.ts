import { chatKeyOfBooking } from '@platform/contracts';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppEnv, Bindings } from '../../env';
import { testD1 } from '../../test-d1';
import type { Member } from './application/ports';
import { chatSheetRoutes } from './http/chat-sheet-routes';
import { d1Unread } from './infrastructure/d1-unread';
import { PASSENGER } from './chat-test-kit';

// The rights of each chat now: open, read only after the trip (docs/129), or not a side at all.
const keyOf = (n: number) => chatKeyOfBooking(`00000000-0000-0000-0000-00000000000${n}`);
const [OPEN, CLOSED, GONE] = [keyOf(1), keyOf(2), keyOf(3)];
const RIGHTS: Readonly<Record<string, Member | null>> = {
  [OPEN]: PASSENGER,
  [CLOSED]: { ...PASSENGER, canWrite: false },
  [GONE]: null,
};
const memberOf = async (_env: Bindings, key: string) => RIGHTS[key] ?? null;

function sheet(app: 'passenger' | 'driver') {
  const env = { DB: testD1() } as unknown as Bindings;
  const routes = new Hono<AppEnv>()
    .use(async (context, next) => {
      const user = { id: PASSENGER.userId, firstName: 'Dilnoza', username: null, allowsWriteToPm: true };
      context.set('session', { app, user, botToken: '', isAdmin: false, teamRole: null });
      await next();
    })
    .route('/', chatSheetRoutes(memberOf));
  const request = (path: string, init?: RequestInit) => routes.request(path, init, env);
  return { env, request };
}

// G68, docs/122: «Yangi xabar» of the open Mini App. G89 U10: a chat that is read only now offers
// no ready answer, and an answer to it is refused, never «Yuborildi» for words that went nowhere.
describe('the sheet «Yangi xabar»', () => {
  it('shows only the unread chats this person may still write to, on this side', async () => {
    const { env, request } = sheet('passenger');
    for (const [at, key] of [OPEN, CLOSED, GONE].entries())
      await d1Unread(env, key).add({ userId: PASSENGER.userId, role: 'passenger' }, { text: 'Rahmat', at });
    const read = async (made: ReturnType<typeof sheet>) =>
      ((await (await made.request('/chats/unread')).json()) as { chats: { key: string }[] }).chats;
    expect((await read({ env, request })).map((chat) => chat.key)).toEqual([OPEN]);
    expect(await read(sheet('driver'))).toEqual([]);
  });

  it('refuses a ready answer to a chat read only now', async () => {
    const { request } = sheet('passenger');
    const answer = (key: string) =>
      request(`/chats/${key}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: 'Yaxshi' }),
        headers: { 'content-type': 'application/json' },
      });
    expect((await answer(CLOSED)).status).toBe(403);
    expect((await answer(GONE)).status).toBe(403);
    // No Durable Object of the chats here: an open chat gets as far as the room.
    expect((await answer(OPEN)).status).toBe(503);
  });
});
