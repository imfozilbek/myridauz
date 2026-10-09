import { channelOf, loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser, testEnv } from './test-api';

// Every Telegram call: the posts of the channel and the messages of the bots.
const telegram: { method: string; body: Record<string, unknown> }[] = [];
let messageId = 0;
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ method: input.split('/').pop() ?? '', body });
  return Response.json({ ok: true, result: { message_id: (messageId += 1) } });
});
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(Date.parse('2026-10-08T03:00:00Z'));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
// The owner approved the post: autoposting is on in this test (docs/33).
Object.assign(testEnv, { CHANNEL_POSTS: 'on' });
const brand = loadBrand();
const SAMARQAND = `@${channelOf(brand, '1718401')?.username ?? ''}`;
const HOUR = 3_600_000;
const [DRIVER, PASSENGER, OTHER_DRIVER] = [81, 82, 83];
const trip = (departAt: number) =>
  json({
    from: '1726273',
    to: '1718401',
    departAt,
    seats: 3,
    price: 90_000,
    womanOnBoard: false,
    pickupMode: 'door',
    comment: '',
  });
// The posts of the trip, not the board of the day nor its pin (G68).
const POSTS = ['sendMessage', 'editMessageText', 'deleteMessage'];
const posts = () =>
  telegram.filter(
    (item) =>
      item.body.chat_id === SAMARQAND &&
      POSTS.includes(item.method) &&
      !String(item.body.text ?? '').startsWith('<b>📋'),
  );
const heads = () => posts().map((item) => [item.method, String(item.body.text ?? '').split('\n')[0]]);

// The life of a post in the channel (G68, docs/122, mockup g68/5 «Post hayoti»).
describe('the life of a channel post (G68)', () => {
  it('new without sound, then on the road, then arrived with the people of the car', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...trip(Date.now() + 3 * HOUR) }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const step = (path: string) =>
      call(`/driver/trips/${published.id}/${path}`, DRIVER, { method: 'POST', app: 'driver' });
    vi.setSystemTime(Date.now() + 2.5 * HOUR);
    await step('depart');
    vi.setSystemTime(Date.now() + 5 * HOUR);
    await step('arrive');
    expect(posts()[0]?.body.disable_notification).toBe(true);
    expect(heads().map(([, head]) => head)).toEqual([
      '<b>🆕 Yangi safar</b>',
      '<b>🆕 Yangi safar</b>',
      '<b>🚗 Yoʻlga chiqdi</b>',
      '<b>🏁 Yetib bordi</b>',
    ]);
    expect(String(posts().at(-1)?.body.text)).toContain('Yoʻl xarajati 2 ga boʻlindi');
    // The board of the day (08:00 now): pinned, with sound once, the picture of the direction above.
    const boards = telegram.filter(
      (item) => item.body.chat_id === SAMARQAND && String(item.body.text ?? '').startsWith('<b>📋'),
    );
    expect(boards[0]).toMatchObject({ method: 'sendMessage' });
    expect(boards[0]?.body).not.toHaveProperty('disable_notification');
    expect(boards[0]?.body.link_preview_options).toMatchObject({
      url: `https://${brand.domain}/yonalish/toshkent-samarqand/`,
      show_above_text: true,
    });
    expect(boards.slice(1).every((item) => item.method === 'editMessageText')).toBe(true);
    expect(String(boards.at(-1)?.body.text)).toContain('yetib bordi</s>');
    expect(telegram.some((item) => item.method === 'pinChatMessage' && item.body.chat_id === SAMARQAND)).toBe(
      true,
    );
  });

  it('a cancelled trip: «Safar bekor qilindi», then the post is deleted', async () => {
    await approvedDriver(OTHER_DRIVER);
    const published = await read<{ id: string }>(
      call('/driver/trips', OTHER_DRIVER, { app: 'driver', ...trip(Date.now() + 6 * HOUR) }),
    );
    telegram.length = 0;
    await call(`/driver/trips/${published.id}/cancel`, OTHER_DRIVER, { method: 'POST', app: 'driver' });
    expect(heads()).toEqual([
      ['editMessageText', '<b>❌ Safar bekor qilindi</b>'],
      ['deleteMessage', ''],
    ]);
  });
});
