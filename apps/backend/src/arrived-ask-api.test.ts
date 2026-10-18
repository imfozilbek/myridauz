import { arrivedAskAt, MINUTE_MS } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { botSender, fakeTelegram } from './bots/test-bot';
import { askArrived } from './modules/reminders';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
vi.useFakeTimers({ toFake: ['Date'] });
// 2026-10-01 07:00 in Tashkent: the trip is in the day, the question comes in the day.
vi.setSystemTime(Date.parse('2026-10-01T02:00:00Z'));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const press = botSender(telegram.fetch);
const BOT = { ...testEnv, TELEGRAM_WEBHOOK_SECRET: 'hook' };
type Seat = { id: string; arrivedAt: number | null; trip: { departAt: number; km: number } };

// One live trip and one seat at a time (docs/172): each case takes its own people.
async function rideOn(driver: number, passenger: number) {
  await approvedDriver(driver);
  await registerUser(passenger);
  const way = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + 5 * 3_600_000,
    seats: 3,
    price: 90_000,
  };
  const trip = await read<{ id: string }>(
    call('/driver/trips', driver, {
      app: 'driver',
      ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
    }),
  );
  const booking = await read<{ id: string }>(
    call(`/trips/${trip.id}/bookings`, passenger, json(doorBooking(1))),
  );
  await call(`/driver/bookings/${booking.id}/confirm`, driver, { method: 'POST', app: 'driver' });
  const link = await read<{ link: string }>(
    call(`/passenger/bookings/${booking.id}/share`, passenger, json({})),
  );
  return { id: booking.id, token: link.link.split('follow_')[1] ?? '' };
}
const seatOf = async (passenger: number, id: string) =>
  (await read<{ bookings: Seat[] }>(call('/passenger/bookings', passenger))).bookings.find(
    (seat) => seat.id === id,
  );
const questions = (passenger: number) =>
  telegram.sentTo(passenger).filter((sent) => String(sent.body.text).includes('Yetib keldingizmi?'));
const answer = (passenger: number, id: string, value: 'yes' | 'no') =>
  press(
    'passenger',
    {
      callback_query: {
        id: 'q',
        from: { id: passenger, first_name: 'Ali' },
        data: `arrived:${id}:${value}`,
        message: { message_id: 7, chat: { id: passenger } },
      },
    },
    'hook',
    BOT,
  );

// «Yetib keldingizmi?» of the passenger bot (G46, docs/43): an hour after the arrival without
// «Yetib keldim», once; «Ha» is the arrival and closes the link of close people.
describe('the bot asks a passenger who did not say she arrived', () => {
  it('asks once an hour after the arrival; «Ha» marks it and closes the link', async () => {
    const PASSENGER = 302;
    const seat = await rideOn(301, PASSENGER);
    const { trip } = (await seatOf(PASSENGER, seat.id)) ?? { trip: { departAt: 0, km: 0 } };
    vi.setSystemTime(arrivedAskAt(trip.departAt, trip.km) + MINUTE_MS);
    await askArrived(testEnv, Date.now());
    await askArrived(testEnv, Date.now());
    const [question, ...more] = questions(PASSENGER);
    expect(more).toEqual([]);
    expect(JSON.stringify(question?.body.reply_markup)).toContain(`arrived:${seat.id}:yes`);
    await answer(PASSENGER, seat.id, 'yes');
    expect((await seatOf(PASSENGER, seat.id))?.arrivedAt).toEqual(expect.any(Number));
    expect((await app.request(`/shared/${seat.token}`, {}, testEnv)).status).toBe(404);
    const edit = telegram
      .sentTo(PASSENGER)
      .filter((sent) => sent.method === 'editMessageText')
      .at(-1);
    expect(String(edit?.body.text)).toContain('Yaqinlaringiz ham bilib oladi');
  });

  it('«Hali yoʻldaman» changes nothing; the link stays', async () => {
    const PASSENGER = 304;
    const seat = await rideOn(303, PASSENGER);
    const { trip } = (await seatOf(PASSENGER, seat.id)) ?? { trip: { departAt: 0, km: 0 } };
    vi.setSystemTime(arrivedAskAt(trip.departAt, trip.km) + MINUTE_MS);
    await askArrived(testEnv, Date.now());
    await answer(PASSENGER, seat.id, 'no');
    expect((await seatOf(PASSENGER, seat.id))?.arrivedAt).toBeNull();
    expect((await app.request(`/shared/${seat.token}`, {}, testEnv)).status).toBe(200);
  });
});
