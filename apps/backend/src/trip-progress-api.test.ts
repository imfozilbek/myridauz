import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { watchLateDepartures } from './modules/reminders';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram: { chat: unknown; text: string; markup: string }[] = [];
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({
    chat: body.chat_id,
    text: String(body.text ?? ''),
    markup: JSON.stringify(body.reply_markup),
  });
  return Response.json({ ok: true, result: { message_id: 1 } });
});
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(Date.parse('2026-10-08T03:00:00Z'));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const HOUR = 3_600_000;
const [DRIVER, PASSENGER, OTHER] = [71, 72, 73];
const trip = (departAt: number, pickupMode = 'door') => ({
  from: '1726273',
  to: '1718401',
  departAt,
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode,
  comment: '',
});

// Every signal a Durable Object of the personal channel would get (docs/64).
const signals: string[] = [];
const FEEDS = {
  idFromName: (name: string) => name,
  get: (name: string) => ({
    fetch: async (request: Request) => {
      signals.push(`${name} ${request.headers.get('x-feed-app')}`);
      return new Response(null, { status: 204 });
    },
  }),
};

describe('«Yoʻlga chiqdim» and «Yetib keldik» through the API (G63, docs/35)', () => {
  it('moves only the own trip, from an hour before its time, and the open screens refresh', async () => {
    await approvedDriver(DRIVER);
    await approvedDriver(OTHER);
    await registerUser(PASSENGER);
    const noPitak = await call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json(trip(Date.now() + 3 * HOUR, 'both')),
    });
    expect([noPitak.status, await noPitak.json()]).toEqual([400, { error: 'trips.no_pitak' }]);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(trip(Date.now() + 3 * HOUR)) }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const waiting = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, OTHER, json(doorBooking(1))),
    );
    const step = (path: string, who = DRIVER) =>
      call(`/driver/trips/${published.id}/${path}`, who, { method: 'POST', app: 'driver', env: { FEEDS } });
    expect((await step('depart', OTHER)).status).toBe(404);
    const early = await step('depart');
    expect([early.status, await early.json()]).toEqual([409, { error: 'trips.too_early_to_depart' }]);
    vi.setSystemTime(Date.now() + 2.5 * HOUR);
    signals.length = 0;
    const left = await read<{ departedAt: number }>(step('depart'));
    expect(left.departedAt).toBe(Date.now());
    // The request without an answer ends at once, both sides hear it; no answer after the departure.
    expect(signals).toEqual([
      `u${OTHER} passenger`,
      `u${DRIVER} driver`,
      `u${DRIVER} driver`,
      `u${PASSENGER} passenger`,
    ]);
    expect(telegram.some((sent) => sent.chat === OTHER && sent.text.includes('javob bermadi'))).toBe(true);
    const answer = await call(`/driver/bookings/${waiting.id}/confirm`, DRIVER, {
      method: 'POST',
      app: 'driver',
    });
    expect([answer.status, await answer.json()]).toEqual([409, { error: 'bookings.wrong_status' }]);
    const late = await call(`/trips/${published.id}/bookings`, OTHER, json(doorBooking(1)));
    expect(await late.json()).toEqual({ error: 'bookings.departed' });
    vi.setSystemTime(Date.now() + 5 * HOUR);
    expect(await read<{ arrivedAt: number }>(step('arrive'))).toMatchObject({ arrivedAt: Date.now() });
    expect((await step('arrive')).status).toBe(409);
  });

  it('asks a driver who forgot the button once, then puts the trip on the road', async () => {
    const departAt = Date.now() + 2 * HOUR;
    const published = await read<{ id: string }>(
      call('/driver/trips', OTHER, { app: 'driver', ...json(trip(departAt)) }),
    );
    telegram.length = 0;
    vi.setSystemTime(departAt + HOUR);
    await watchLateDepartures(testEnv, Date.now());
    await watchLateDepartures(testEnv, Date.now() + 15 * 60_000);
    expect(telegram.map((sent) => sent.chat)).toEqual([OTHER]);
    expect(telegram[0]?.text).toContain('«Yoʻlga chiqdim»');
    expect(telegram[0]?.markup).toContain(`?mytrip=${published.id}`);
    vi.setSystemTime(departAt + 2 * HOUR);
    await watchLateDepartures(testEnv, Date.now());
    const shown = await read<{ departedAt: number }>(call(`/trips/${published.id}`, PASSENGER));
    expect(shown.departedAt).toBe(departAt + 2 * HOUR);
  });

  it('tells the family «Yetib keldik» at once and shares no trip that arrived', async () => {
    const departAt = Date.now() + 2 * HOUR;
    const { id } = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(trip(departAt)) }),
    );
    const post = (path: string) =>
      call(`/driver/trips/${id}/${path}`, DRIVER, { method: 'POST', app: 'driver' });
    const { link } = await read<{ link: string }>(post('share'));
    const shared = async () =>
      (await app.request(`/shared/${link.split('follow_')[1] ?? ''}`, {}, testEnv)).json();
    vi.setSystemTime(departAt - HOUR / 2);
    await read(post('depart'));
    expect(await shared()).toMatchObject({ status: 'on_the_way' });
    await read(post('arrive'));
    expect(await shared()).toMatchObject({ status: 'arrived' });
    expect((await post('share')).status).toBe(409);
  });
});
