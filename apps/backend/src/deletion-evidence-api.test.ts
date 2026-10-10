import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { signTelegramData } from './shared/auth/test-signing';
import { call, initData, nowSeconds, registerUser, testEnv, doorBooking } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 181;
const PASSENGER = 182;
const NEW_ACCOUNT = 183;
const trip = {
  from: '1726273',
  to: '1718401',
  departAt: Date.now() + 5 * 3_600_000,
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode: 'door',
  comment: '',
};

// Chat rooms that were asked to forget (docs/07).
const forgotten: string[] = [];
const chats = {
  idFromName: (name: string) => name,
  get: (name: string) => ({
    fetch: async (request: Request) => {
      if (new URL(request.url).pathname === '/forget') forgotten.push(name);
      return new Response(null, { status: 204 });
    },
  }),
};
const deleteDriver = async (id: number) => {
  const headers = {
    authorization: `tma ${await initData(id, testEnv.DRIVER_BOT_TOKEN)}`,
    'x-mini-app': 'driver',
  };
  return app.request('/me', { method: 'DELETE', headers }, { ...testEnv, CHATS: chats });
};

describe('deleting the account during a complaint (docs/17, docs/65 A5)', () => {
  it('keeps the chat as evidence and the team still decides and blocks by id and phone', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(trip) }),
    );
    const booking = await read<{ id: string; chatKey: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const filed = await call(
      '/complaints',
      PASSENGER,
      json({ bookingId: booking.id, reasons: ['harassment'] }),
    );
    expect(filed.status).toBe(201);
    expect((await deleteDriver(DRIVER)).status).toBe(204);
    expect(forgotten).not.toContain(booking.chatKey);

    const queue = await read<{ complaints: { id: string }[] }>(
      call('/admin/complaints', OWNER, { app: 'admin' }),
    );
    const decision = { app: 'admin', ...json({ action: 'block', days: null }) };
    const id = queue.complaints[0]?.id ?? '';
    expect((await call(`/admin/complaints/${id}/decision`, OWNER, decision)).status).toBe(204);
    // Neither the same Telegram account nor a new one with the held phone comes back.
    expect(await (await registerUser(DRIVER)).json()).toMatchObject({ error: 'users.blocked' });
    const contact = await signTelegramData(
      testEnv.PASSENGER_BOT_TOKEN,
      { contact: { user_id: NEW_ACCOUNT, phone_number: `99890${DRIVER}` } },
      nowSeconds(),
    );
    const body = { consent: true, firstName: 'Ali', gender: 'male', contact };
    expect((await call('/me/registration', NEW_ACCOUNT, json(body))).status).toBe(403);
  });
});
