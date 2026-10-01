import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read, seen } from './bookings-test-api';
import { call, registerUser, testEnv, doorBooking } from './test-api';

// Every Telegram call: the prepared card and the messages to close people.
const telegram: { method: string; body: Record<string, unknown> }[] = [];
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ method: input.split('/').pop() ?? '', body });
  return Response.json({ ok: true, result: { message_id: 1, id: 'prepared-1' } });
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 91;
const PASSENGER = 92;
const OTHER = 93;
const CLOSE = [101, 102, 103, 104, 105, 106];
const DAY = 24 * 3_600_000;

async function confirmedBooking() {
  await approvedDriver(DRIVER);
  await registerUser(PASSENGER);
  await registerUser(OTHER);
  const trip = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + 5 * 3_600_000,
    seats: 3,
    price: 90_000,
  };
  const published = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({ ...trip, womanOnBoard: false, pickupMode: 'both', comment: '' }),
    }),
  );
  const booking = await read<{ id: string }>(
    call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
  );
  const share = () => call(`/passenger/bookings/${booking.id}/share`, PASSENGER, { method: 'POST' });
  expect((await share()).status).toBe(409);
  await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
  return { booking, share };
}
const tokenOf = (link: string) => link.split('follow_')[1] ?? '';
const shared = async (token: string) => app.request(`/shared/${token}`, {}, testEnv);

describe('"Yaqinlarimga yuborish" (docs/43)', () => {
  it('shows the trip only by its token, without phones, and to at most 5 close people', async () => {
    const { booking, share } = await confirmedBooking();
    expect((await call(`/passenger/bookings/${booking.id}/share`, OTHER, { method: 'POST' })).status).toBe(
      404,
    );
    const created = await read<{ preparedMessageId: string; link: string }>(share());
    expect(created.preparedMessageId).toBe('prepared-1');
    expect(created.link).toMatch(/^https:\/\/t\.me\/.+\?start=follow_[\w-]{43}$/u);
    expect(telegram.find((item) => item.method === 'savePreparedInlineMessage')?.body.user_id).toBe(
      PASSENGER,
    );
    const token = tokenOf(created.link);
    expect((await shared('x'.repeat(43))).status).toBe(404);
    const trip = await read<{ passengerName: string; plate: string; status: string }>(shared(token));
    expect(trip).toMatchObject({ passengerName: 'Ali', plate: '01A123BC', status: 'waiting' });
    for (const id of CLOSE.slice(0, 5))
      expect((await call(`/shared/${token}/follow`, id, { method: 'POST' })).status).toBe(204);
    expect((await call(`/shared/${token}/follow`, CLOSE[0] ?? 0, { method: 'POST' })).status).toBe(204);
    expect((await call(`/shared/${token}/follow`, CLOSE[5] ?? 0, { method: 'POST' })).status).toBe(409);
    for (const text of seen) expect(text).not.toMatch(/99890\d+|"(phone|username)"/u);
  });

  it('tells close people when the passenger gets in and arrives, then stops by the button', async () => {
    const { booking, share } = await confirmedBooking();
    const token = tokenOf((await read<{ link: string }>(share())).link);
    await call(`/shared/${token}/follow`, CLOSE[0] ?? 0, { method: 'POST' });
    telegram.length = 0;
    const boarded = await read<{ boardedAt: number }>(
      call(`/passenger/bookings/${booking.id}/boarded`, PASSENGER, { method: 'POST' }),
    );
    expect(boarded.boardedAt).toBeGreaterThan(0);
    await call(`/passenger/bookings/${booking.id}/boarded`, PASSENGER, { method: 'POST' });
    await call(`/passenger/bookings/${booking.id}/arrived`, PASSENGER, { method: 'POST' });
    const toClose = telegram.filter((item) => item.body.chat_id === CLOSE[0]).map((item) => item.body.text);
    expect(toClose).toEqual(['Ali mashinaga chiqdi: Chevrolet Cobalt, 01 A 123 BC.', 'Ali yetib keldi.']);
    expect((await read<{ status: string }>(shared(token))).status).toBe('arrived');
    expect((await call(`/passenger/bookings/${booking.id}/boarded`, OTHER, { method: 'POST' })).status).toBe(
      404,
    );
    expect(
      (await call(`/passenger/bookings/${booking.id}/share/stop`, OTHER, { method: 'POST' })).status,
    ).toBe(404);
    expect(
      (await call(`/passenger/bookings/${booking.id}/share/stop`, PASSENGER, { method: 'POST' })).status,
    ).toBe(204);
    expect((await shared(token)).status).toBe(404);
  });

  it('closes the link by itself a day after the arrival', async () => {
    const { share } = await confirmedBooking();
    const token = tokenOf((await read<{ link: string }>(share())).link);
    expect((await shared(token)).status).toBe(200);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 2 * DAY);
    expect((await shared(token)).status).toBe(404);
    expect((await call(`/shared/${token}/follow`, CLOSE[1] ?? 0, { method: 'POST' })).status).toBe(404);
    vi.useRealTimers();
  });
});
