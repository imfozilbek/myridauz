import { loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, testEnv } from './test-api';

// Every Telegram call: messages of the bots and the channel posts.
const telegram: { method: string; body: Record<string, unknown> }[] = [];
let messageId = 0;
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ method: input.split('/').pop() ?? '', body });
  return Response.json({ ok: true, result: { message_id: (messageId += 1) } });
});
afterAll(() => vi.unstubAllGlobals());
// The owner approved the post: autoposting is on in this test (docs/33).
Object.assign(testEnv, { CHANNEL_POSTS: 'on' });

// The channels of Samarqand viloyati and Toshkent viloyati in the brand config (docs/37).
const { channels } = loadBrand();
const SAMARQAND = `@${channels['1718'] ?? ''}`;
const TOSHKENT_REGION = `@${channels['1727'] ?? ''}`;
const DRIVER = 71;
const PASSENGER = 72;
const tomorrow = () => new Date(Date.now() + 29 * 3_600_000).toISOString().slice(0, 10);
const trip = (departAt: number) =>
  json({
    from: '1726273',
    to: '1718401',
    departAt,
    seats: 2,
    price: 90_000,
    womanOnBoard: false,
    comment: '',
  });
const sentTo = (chatId: number | string) => telegram.filter((item) => item.body.chat_id === chatId);

describe('route subscriptions and channel posts (docs/15, docs/24)', () => {
  it('tells a subscribed passenger about a new trip and posts it to the channel of its region', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const route = { from: '1726', to: '1718', date: null, woman: false };
    const created = await read<{ id: string; expired: boolean }>(
      call('/passenger/subscriptions', PASSENGER, json(route)),
    );
    expect(created.expired).toBe(false);
    expect((await call('/passenger/subscriptions', PASSENGER, json({ ...route, from: 'x' }))).status).toBe(
      400,
    );
    telegram.length = 0;
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...trip(Date.now() + 5 * 3_600_000) }),
    );
    const [told] = sentTo(PASSENGER);
    expect(String(told?.body.text)).toContain('Siz kutgan safar chiqdi');
    expect(JSON.stringify(told?.body.reply_markup)).toContain(`?trip=${published.id}`);
    const [post] = sentTo(SAMARQAND);
    expect(JSON.stringify(post?.body.reply_markup)).toContain(`startapp=trip_${published.id}`);
    expect(sentTo(TOSHKENT_REGION)).toEqual([]);
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json({ seats: 2 })),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const edit = telegram.find((item) => item.method === 'editMessageText');
    expect(edit?.body.chat_id).toBe(SAMARQAND);
    expect(String(edit?.body.text)).toContain('Joy qolmagan');
  });

  it('tells a subscribed driver about a new request and lets a person manage the list', async () => {
    const route = { from: '1726', to: '1718', date: tomorrow(), woman: true };
    const created = await read<{ id: string; woman: boolean }>(
      call('/driver/subscriptions', DRIVER, { app: 'driver', ...json(route) }),
    );
    expect(created.woman).toBe(false);
    telegram.length = 0;
    await call(
      '/passenger/requests',
      PASSENGER,
      json({ ...route, from: '1726273', to: '1718401', seats: 1, price: 90_000 }),
    );
    expect(String(sentTo(DRIVER)[0]?.body.text)).toContain('Yoʻnalishingizda yangi soʻrov');
    const mine = await read<{ subscriptions: { id: string }[] }>(
      call('/driver/subscriptions', DRIVER, { app: 'driver' }),
    );
    expect(mine.subscriptions.map((item) => item.id)).toEqual([created.id]);
    expect(
      (await call(`/driver/subscriptions/${created.id}/renew`, DRIVER, { method: 'POST', app: 'driver' }))
        .status,
    ).toBe(404);
    expect(
      (await call(`/driver/subscriptions/${created.id}`, PASSENGER, { method: 'DELETE', app: 'driver' }))
        .status,
    ).toBe(404);
    expect(
      (await call(`/driver/subscriptions/${created.id}`, DRIVER, { method: 'DELETE', app: 'driver' })).status,
    ).toBe(204);
  });
});
