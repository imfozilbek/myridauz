import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { expireRequests } from './modules/ride-requests';
import { call, registerUser, REQUEST_WAY, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-01 10:00 in Tashkent: the day time, the rings have sound.
const START = Date.parse('2026-10-01T05:00:00Z');
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(START);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 51;
const SECOND_DRIVER = 52;
const PASSENGER = 53;
const PRICE = 90_000;

async function asked(passenger: number, days: number) {
  const date = tashkentDate(Date.now() + days * DAY_MS);
  const way = { from: '1726273', to: '1718401', date, seats: 1, price: PRICE, ...REQUEST_WAY };
  const request = await read<{ id: string }>(call('/passenger/requests', passenger, json(way)));
  return { request, departAt: Date.parse(`${date}T04:00:00Z`) };
}
const offer = (driver: number, requestId: string, departAt: number) =>
  read<{ id: string }>(
    call(`/driver/requests/${requestId}/offers`, driver, {
      app: 'driver',
      ...json({ departAt, price: PRICE }),
    }),
  );
const toPassenger = () => telegram.sentTo(PASSENGER);
// The last form of a card: its last edit (an unpin after it carries no text).
const lastText = () =>
  String(
    toPassenger()
      .filter((sent) => sent.method === 'editMessageText')
      .at(-1)?.body.text,
  );

// The request of a passenger lives as one card in the passenger bot (G68, docs/122).
describe('the request card of the passenger bot (G68, docs/122)', () => {
  it('waits on top of the chat, counts the offers, rings for the first one only, ends accepted', async () => {
    await approvedDriver(DRIVER);
    await approvedDriver(SECOND_DRIVER);
    await registerUser(PASSENGER);
    const { request, departAt } = await asked(PASSENGER, 1);
    const card = toPassenger().find((sent) => String(sent.body.text).includes('haydovchilar koʻrmoqda'));
    expect(card?.body.disable_notification).toBe(true);
    expect(toPassenger().some((sent) => sent.method === 'pinChatMessage')).toBe(true);
    const first = await offer(DRIVER, request.id, departAt);
    const ring = toPassenger().find((sent) => String(sent.body.text).includes('Soʻrovingizga taklif keldi:'));
    expect(ring?.body.reply_parameters).toMatchObject({ message_id: card?.id });
    expect(ring?.body).not.toHaveProperty('disable_notification');
    const edits = () => toPassenger().filter((sent) => sent.method === 'editMessageText');
    expect(String(edits().at(-1)?.body.text)).toContain('1 ta taklif keldi');
    await offer(SECOND_DRIVER, request.id, departAt);
    expect(String(edits().at(-1)?.body.text)).toContain('2 ta taklif keldi');
    const rings = toPassenger().filter((sent) => String(sent.body.text).includes('taklif keldi:'));
    expect(rings).toHaveLength(1);
    await call(`/passenger/offers/${first.id}/accept`, PASSENGER, { method: 'POST' });
    expect(
      edits().some(
        (sent) => sent.body.message_id === card?.id && String(sent.body.text).includes('qabul qildingiz'),
      ),
    ).toBe(true);
    expect(toPassenger().some((sent) => sent.method === 'unpinChatMessage')).toBe(true);
  });

  it('says so when the passenger cancels it and when its day is over', async () => {
    const cancelled = await asked(PASSENGER, 2);
    await call(`/passenger/requests/${cancelled.request.id}/cancel`, PASSENGER, { method: 'POST' });
    expect(lastText()).toContain('Bekor qilindi');
    await asked(PASSENGER, 3);
    await expireRequests(testEnv, Date.now() + 5 * DAY_MS);
    expect(lastText()).toContain('Soʻrov muddati tugadi');
  });
});
