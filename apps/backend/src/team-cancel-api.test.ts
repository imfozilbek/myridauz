import { ADMIN_JOURNAL_PATH, adminTripCancelPath, journalSchema } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

// Every Telegram message: to whom and what.
const sent: { chat: number; text: string }[] = [];
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body =
    typeof init?.body === 'string' ? (JSON.parse(init.body) as { chat_id?: number; text?: string }) : {};
  if (body.chat_id !== undefined) sent.push({ chat: body.chat_id, text: String(body.text ?? '') });
  return Response.json({ ok: true, result: { message_id: 1 } });
});
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 71;
const PASSENGER = 72;
const trip = {
  from: '1726273',
  to: '1718401',
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode: 'door',
  comment: '',
};
const cancel = (id: string, by: number, reason: string) =>
  call(adminTripCancelPath(id), by, { app: 'admin', ...json({ reason }) });
const wallet = async () =>
  (await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }))).bonus;

// The team cancels one trip with a reason (Q5 of docs/111, G45): the seats go as when the driver
// cancels, the commission comes back, the passenger hears the team did it, the driver reads why.
describe('the team cancels a trip', () => {
  it('cancels the seats, gives the commission back, tells both sides and keeps it in the journal', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...trip, departAt: Date.now() + 5 * 3_600_000 }),
      }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    const before = await wallet();
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    expect(await wallet()).toBeLessThan(before);
    expect((await cancel(published.id, PASSENGER, 'Xavfli haydovchi')).status).toBe(403);
    expect((await cancel(published.id, OWNER, 'ok')).status).toBe(400);
    sent.length = 0;
    expect((await cancel(published.id, OWNER, 'Xavfli haydovchi')).status).toBe(204);
    expect(await wallet()).toBe(before);
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    expect(mine.bookings.find((item) => item.id === booking.id)?.status).toBe('cancelled_by_driver');
    expect(sent.some((m) => m.chat === PASSENGER && m.text.includes('Safarni jamoa bekor qildi'))).toBe(true);
    expect(sent.some((m) => m.chat === DRIVER && m.text.includes('Sabab: Xavfli haydovchi'))).toBe(true);
    expect((await read<{ status: string }>(call(`/trips/${published.id}`, PASSENGER))).status).toBe(
      'cancelled',
    );
    expect((await cancel(published.id, OWNER, 'Yana bir bor')).status).toBe(409);
    const journal = journalSchema.parse(
      await (await call(ADMIN_JOURNAL_PATH, OWNER, { app: 'admin' })).json(),
    );
    expect(journal.entries[0]).toMatchObject({ kind: 'trip', subject: published.id, action: 'cancel' });
  });
});
