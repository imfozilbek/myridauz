import { groupChats, loadBrand } from '@platform/brands';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { localLocations } from './modules/locations';
import { call, registerUser, testEnv } from './test-api';

// Every Telegram call: the posts of the group and the messages of the bots.
const telegram: { method: string; body: Record<string, unknown> }[] = [];
let messageId = 0;
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ method: input.split('/').pop() ?? '', body });
  return Response.json({ ok: true, result: { message_id: (messageId += 1) } });
});
afterAll(() => vi.unstubAllGlobals());
// The owner approved the posts: autoposting is on in this test (docs/33).
Object.assign(testEnv, { CHANNEL_POSTS: 'on' });
const brand = loadBrand();
const [GROUP] = [...groupChats(brand)];
const [DRIVER, PASSENGER, OFFERING, ACCEPTING] = [91, 92, 93, 94];
// From the door in Mirobod to a home in Yakkabogʻ: the route of the direction group (docs/222).
const MIROBOD = { lat: 41.292, lng: 69.279 };
const YAKKABOG = { lat: 38.9755, lng: 66.6853 };
const [FROM, TO] = ['1726273', '1710250'];
const place = (id: string, parentId: string | null, name: string, oneCity = false) => ({
  id,
  parentId,
  type: parentId ? ('city' as const) : ('region' as const),
  name,
  lat: 41,
  lng: 69,
  oneCity,
});
localLocations.load([
  place('1726', null, 'Toshkent shahri', true),
  place(FROM, '1726', 'Mirobod'),
  place('1710', null, 'Qashqadaryo viloyati'),
  place(TO, '1710', 'Yakkabogʻ'),
]);
await localLocations.saveDistance(TO, FROM, 420, 0);
const way = { pickupMode: 'door', pickup: MIROBOD, dropoff: YAKKABOG };
const inGroup = () => telegram.filter((item) => item.body.chat_id === GROUP);
const head = (item: { body: Record<string, unknown> } | undefined) =>
  String(item?.body.text ?? '').split('\n')[0];

// The trips and the requests of the Mini App in the direction group, as its own cards (docs/223).
describe('the cards of the Mini App in the direction group (G94, docs/223)', () => {
  it('a request goes there with the turquoise R and goes away when it is cancelled', async () => {
    await registerUser(PASSENGER);
    const date = tashkentDate(Date.now() + DAY_MS);
    const response = await call(
      '/passenger/requests',
      PASSENGER,
      json({ from: FROM, to: TO, date, seats: 2, price: 150_000, ...way }),
    );
    expect(response.status).toBe(201);
    const request = await read<{ id: string }>(Promise.resolve(response));
    const [post] = inGroup();
    expect(post?.method).toBe('sendMessage');
    expect(head(post)).toContain('🙋 МАШИНА КЕРАК · ');
    expect(head(post)).toContain(`emoji-id="${brand.groupCards?.marks.request}"`);
    expect(post?.body.disable_notification).toBe(true);
    await call(`/passenger/requests/${request.id}/cancel`, PASSENGER, { method: 'POST' });
    expect(inGroup().map((item) => item.method)).toEqual(['sendMessage', 'editMessageText', 'deleteMessage']);
  });

  it('a trip goes there with the amber R, in Cyrillic', async () => {
    await approvedDriver(DRIVER);
    const departAt = Date.now() + DAY_MS;
    const before = inGroup().length;
    const trip = { from: FROM, to: TO, departAt, seats: 4, price: 150_000, womanOnBoard: false };
    await call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({ ...trip, pickupMode: 'door', comment: '' }),
    });
    const post = inGroup()[before];
    expect(head(post)).toContain('🚗 БЎШ ');
    expect(head(post)).toContain(`emoji-id="${brand.groupCards?.marks.trip}"`);
    expect(post?.body.reply_markup).toMatchObject({ inline_keyboard: [[{ text: '💺 Жой банд қилиш' }]] });
  });

  it('a request matched by an accepted offer goes away from the group too', async () => {
    await approvedDriver(OFFERING);
    await registerUser(ACCEPTING);
    const date = tashkentDate(Date.now() + 2 * DAY_MS);
    const asked = { from: FROM, to: TO, date, seats: 1, price: 150_000, ...way };
    const request = await read<{ id: string }>(call('/passenger/requests', ACCEPTING, json(asked)));
    const before = inGroup().length;
    const offer = await read<{ id: string }>(
      call(`/driver/requests/${request.id}/offers`, OFFERING, {
        app: 'driver',
        ...json({ departAt: Date.parse(`${date}T05:00:00Z`), price: 150_000 }),
      }),
    );
    await call(`/passenger/offers/${offer.id}/accept`, ACCEPTING, { method: 'POST' });
    // The offer's own trip may come to the group as a trip; the request's post says it closed and goes.
    const after = inGroup().slice(before);
    const closed = after.findIndex((item) => head(item) === '<b>✅ Йўловчи сўрови ёпилди</b>');
    expect(after[closed]?.method).toBe('editMessageText');
    expect(after[closed + 1]?.method).toBe('deleteMessage');
  });
});
