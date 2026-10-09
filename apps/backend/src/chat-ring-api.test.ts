import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { botSignals } from './modules/chat/infrastructure/bot-signals';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-01 10:00 in Tashkent: the day time, the rings have sound.
const START = Date.parse('2026-10-01T05:00:00Z');
const HOUR = 3_600_000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(START);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 61;
const PASSENGER = 62;
// One trip of one driver at a time (docs/103): the second test has its own people.
const OTHER_DRIVER = 63;
const OTHER_PASSENGER = 64;

async function confirmedSeat(driver = DRIVER, passenger = PASSENGER) {
  await approvedDriver(driver);
  await registerUser(passenger);
  const trip = { from: '1726273', to: '1718401', departAt: START + 10 * HOUR, seats: 3, price: 90_000 };
  const published = await read<{ id: string }>(
    call('/driver/trips', driver, {
      app: 'driver',
      ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
    }),
  );
  const seat = await read<{ id: string; chatKey: string }>(
    call(`/trips/${published.id}/bookings`, passenger, json(doorBooking(1))),
  );
  await call(`/driver/bookings/${seat.id}/confirm`, driver, { method: 'POST', app: 'driver' });
  return seat;
}

const lastTo = (id: number) => telegram.sentTo(id).at(-1);
// The trip card is the first message of the passenger bot; its later forms are edits of it.
const cardOf = (id: number) => telegram.sentTo(id).find((sent) => sent.method === 'sendMessage');

// A message or a call in the chat of a seat rings under the trip card (G68, docs/122 rule 5).
describe('the chat of a seat in the bots (G68, docs/122 rule 5)', () => {
  it('a message rings under the trip card with a button to the chat; a read rings nothing', async () => {
    const seat = await confirmedSeat();
    const card = cardOf(PASSENGER);
    const signals = botSignals(testEnv);
    const passenger = { userId: PASSENGER, role: 'passenger' as const, from: DRIVER };
    await signals.newMessage(passenger, seat.chatKey);
    const ring = lastTo(PASSENGER);
    expect(ring?.body.text).toMatch(/^💬 .+ sizga xabar yozdi$/u);
    expect(ring?.body.reply_parameters).toMatchObject({ message_id: card?.id });
    expect(ring?.body).not.toHaveProperty('disable_notification');
    expect(JSON.stringify(ring?.body.reply_markup)).toContain(`chat=${seat.chatKey}`);
    const before = telegram.sentTo(PASSENGER).filter((sent) => sent.method === 'sendMessage').length;
    await signals.read(passenger, seat.chatKey);
    expect(telegram.sentTo(PASSENGER).filter((sent) => sent.method === 'sendMessage')).toHaveLength(before);
  });

  it('the driver hears a message and a missed call under the trip card; a call rings at night', async () => {
    const seat = await confirmedSeat(OTHER_DRIVER, OTHER_PASSENGER);
    const signals = botSignals(testEnv);
    const driver = { userId: OTHER_DRIVER, role: 'driver' as const, from: OTHER_PASSENGER };
    await signals.newMessage(driver, seat.chatKey);
    expect(lastTo(OTHER_DRIVER)?.body.text).toMatch(/^💬 .+ sizga xabar yozdi$/u);
    expect(lastTo(OTHER_DRIVER)?.body.reply_parameters).toBeDefined();
    // 23:00 in Tashkent: a missed call waits quietly, a call that rings now has sound.
    vi.setSystemTime(START + 13 * HOUR);
    await signals.missedCall(driver, seat.chatKey);
    expect(lastTo(OTHER_DRIVER)?.body).toMatchObject({ disable_notification: true });
    await signals.incomingCall(driver, seat.chatKey);
    expect(lastTo(OTHER_DRIVER)?.body.text).toMatch(/^📞 .+ sizga qoʻngʻiroq qilyapti$/u);
    expect(lastTo(OTHER_DRIVER)?.body).not.toHaveProperty('disable_notification');
    vi.setSystemTime(START);
  });

  it('a chat without a seat (a talk about a request) is told as before', async () => {
    await registerUser(PASSENGER);
    await botSignals(testEnv).newMessage({ userId: PASSENGER, role: 'passenger', from: DRIVER }, 'tnone');
    expect(lastTo(PASSENGER)?.body.reply_parameters).toBeUndefined();
    expect(lastTo(PASSENGER)?.body.text).toBe('Sizga yangi xabar keldi. Javob berish uchun chatni oching.');
  });
});
