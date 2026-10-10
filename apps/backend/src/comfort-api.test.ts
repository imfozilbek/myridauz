import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read, seen } from './bookings-test-api';
import { call, pid, registerUser, testEnv, doorBooking } from './test-api';

// Every Telegram call: bot messages about trips and the prepared cards.
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

const DRIVER = 71;
const PASSENGER = 72;
const STRANGER = 73;
const CLOSE = 74;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const publish = (departAt = Date.now() + 5 * HOUR) =>
  read<{ id: string; departAt: number; recommendedPrice: number | null }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({
        from: '1726273',
        to: '1718401',
        departAt,
        seats: 3,
        price: 90_000,
        womanOnBoard: false,
        pickupMode: 'door',
        comment: '',
      }),
    }),
  );
const toPassenger = () => telegram.filter((item) => item.body.chat_id === PASSENGER);
const favorites = () =>
  read<{ drivers: { id: number }[]; trips: { id: string }[] }>(call('/passenger/favorites', PASSENGER));

describe('"Sevimli haydovchilar" (docs/18)', () => {
  it('saves an approved driver, shows the trips and tells about a new one', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    await registerUser(STRANGER);
    const put = async (id: number) =>
      call(`/passenger/favorites/${await pid(id)}`, PASSENGER, { method: 'PUT' });
    expect((await put(PASSENGER)).status).toBe(404);
    expect((await put(STRANGER)).status).toBe(404);
    expect((await put(DRIVER)).status).toBe(204);
    expect((await put(DRIVER)).status).toBe(204);
    expect(await favorites()).toMatchObject({
      drivers: [{ id: await pid(DRIVER), firstName: 'Ali' }],
      trips: [],
    });
    telegram.length = 0;
    // Days apart from the trips of the other tests: a driver makes one trip at a time (docs/103).
    const trip = await publish(Date.now() + 6 * DAY);
    expect(trip.recommendedPrice).toBeGreaterThan(0);
    const told = toPassenger();
    expect(told).toHaveLength(1);
    // A line with ♥ in the news card of the route (G68, docs/122 rule 4).
    expect(String(told[0]?.body.text)).toContain('♥ Ali · ');
    expect(JSON.stringify(told[0]?.body.reply_markup)).toContain('?find=1726273_1718401_');
    expect((await favorites()).trips.map((item) => item.id)).toEqual([trip.id]);
    expect(
      (await call(`/passenger/favorites/${await pid(DRIVER)}`, PASSENGER, { method: 'DELETE' })).status,
    ).toBe(204);
    expect(
      (await call(`/passenger/favorites/${await pid(DRIVER)}`, PASSENGER, { method: 'DELETE' })).status,
    ).toBe(404);
    telegram.length = 0;
    await publish(Date.now() + 9 * DAY);
    expect(toPassenger()).toEqual([]);
  });
});

describe('the driver shares a trip with the family (docs/43, G18)', () => {
  it('shows the trip without phones and tells the family when it is cancelled', async () => {
    const trip = await publish();
    const share = (id: number) =>
      call(`/driver/trips/${trip.id}/share`, id, { method: 'POST', app: 'driver' });
    expect((await share(STRANGER)).status).toBe(404);
    const created = await read<{ link: string; preparedMessageId: string }>(share(DRIVER));
    const prepared = telegram.find((item) => item.method === 'savePreparedInlineMessage');
    expect(prepared?.body.user_id).toBe(DRIVER);
    expect(JSON.stringify(prepared?.body)).toContain('Mashina: Chevrolet Cobalt, 01 A 123 BC.');
    const token = created.link.split('follow_')[1] ?? '';
    const shared = async () => app.request(`/shared/${token}`, {}, testEnv);
    expect(await read(shared())).toMatchObject({
      passengerName: 'Ali',
      plate: '01A123BC',
      status: 'waiting',
    });
    expect((await call(`/shared/${token}/follow`, CLOSE, { method: 'POST' })).status).toBe(204);
    telegram.length = 0;
    // The new time reaches the family too (G75, docs/158 И); a second later stays on the same day.
    const retimed = await call(`/driver/trips/${trip.id}/time`, DRIVER, {
      app: 'driver',
      ...json({ departAt: trip.departAt + 1000 }),
    });
    expect(retimed.status).toBe(200);
    await call(`/driver/trips/${trip.id}/cancel`, DRIVER, { method: 'POST', app: 'driver' });
    const toClose = telegram.filter((item) => item.body.chat_id === CLOSE).map((item) => item.body.text);
    expect(toClose).toHaveLength(2);
    expect(String(toClose[0])).toMatch(/^Vaqt oʻzgardi: Ali /u);
    expect(toClose[1]).toBe('Safar bekor qilindi.');
    expect((await shared()).status).toBe(404);
    for (const text of seen) expect(text).not.toMatch(/99890\d+|"(phone|username)"/u);
  });
});

describe('"Safarlar tarixi" (docs/18)', () => {
  it('shows past rides and the stars, the received ones only once published', async () => {
    const trip = await publish();
    const booking = await read<{ id: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(2))),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const history = (id: number, side: 'passenger' | 'driver') =>
      read<{ trips: Record<string, unknown>[] }>(call(`/${side}/history`, id, { app: side }));
    expect((await history(PASSENGER, 'passenger')).trips).toEqual([]);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + DAY);
    const review = (id: number, app: string) =>
      call('/reviews', id, { app, ...json({ bookingId: booking.id, stars: 5 }) });
    expect((await review(PASSENGER, 'passenger')).status).toBe(204);
    expect((await history(PASSENGER, 'passenger')).trips).toEqual([
      expect.objectContaining({ id: booking.id, people: ['Ali'], seats: 2, given: 5, received: null }),
    ]);
    expect((await history(DRIVER, 'driver')).trips).toEqual([
      expect.objectContaining({ id: trip.id, people: ['Ali'], seats: 2, given: null, received: null }),
    ]);
    await review(DRIVER, 'driver');
    expect((await history(DRIVER, 'driver')).trips[0]).toMatchObject({ received: 5 });
    expect((await history(PASSENGER, 'passenger')).trips[0]).toMatchObject({ given: 5, received: 5 });
    vi.useRealTimers();
  });
});
