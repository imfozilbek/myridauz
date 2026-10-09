import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import type { Bindings } from './env';
import { d1Unread } from './modules/chat/infrastructure/d1-unread';
import { testD1 } from './test-d1';
import { call, doorBooking, registerUser } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

const [DRIVER, PASSENGER, STRANGER] = [91, 92, 93];

async function bookedChat() {
  await approvedDriver(DRIVER);
  for (const id of [PASSENGER, STRANGER]) await registerUser(id);
  const published = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({
        from: '1726273',
        to: '1718401',
        departAt: Date.now() + 5 * 3_600_000,
        seats: 3,
        price: 90_000,
        womanOnBoard: false,
        pickupMode: 'door',
        comment: '',
      }),
    }),
  );
  return read<{ chatKey: string }>(call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))));
}

// The unread counters live in D1; the rest of this test keeps the memory of the other modules.
const unreadDb = { DB: testD1() };
let chatKey = '';
beforeAll(async () => {
  ({ chatKey } = await bookedChat());
});

// The sheet «Yangi xabar» of the open Mini App (G68, docs/122): the last words of an unread chat,
// a ready answer without opening the chat.
describe('the unread chats for the sheet (G68)', () => {
  it('gives the last message of each unread chat only to the Mini App of that side', async () => {
    await d1Unread(unreadDb as Bindings, chatKey).add(
      { userId: PASSENGER, role: 'passenger' },
      { text: 'Grand oldida boʻlaman', at: 5 },
    );
    const unread = (id: number, app: string) =>
      read<{ chats: unknown[] }>(call('/chats/unread', id, { app, env: unreadDb }));
    expect((await unread(PASSENGER, 'passenger')).chats).toEqual([
      { key: chatKey, count: 1, text: 'Grand oldida boʻlaman', at: 5 },
    ]);
    expect((await unread(PASSENGER, 'driver')).chats).toEqual([]);
    expect((await unread(STRANGER, 'passenger')).chats).toEqual([]);
  });

  it('a ready answer goes only from a person of the chat, with a text', async () => {
    const answer = (id: number, body: unknown, app = 'passenger') =>
      call(`/chats/${chatKey}/messages`, id, { app, ...json(body) });
    expect((await answer(STRANGER, { text: 'Yaxshi' })).status).toBe(403);
    expect((await answer(PASSENGER, { text: ' ' })).status).toBe(400);
    expect((await call('/chats/not-a-key/messages', PASSENGER, json({ text: 'Yaxshi' }))).status).toBe(403);
    // Without the Durable Objects of the chats (tests) the message cannot go.
    expect((await answer(DRIVER, { text: 'Yaxshi' }, 'driver')).status).toBe(503);
  });
});
