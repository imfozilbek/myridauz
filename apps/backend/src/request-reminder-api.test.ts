import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { sendReminders } from './modules/reminders';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-01 10:00 in Tashkent: the day time.
const START = Date.parse('2026-10-01T05:00:00Z');
const HOUR = 3_600_000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(START);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
botSender(telegram.fetch);

const DRIVER = 91;
const PASSENGER = 92;
const STILL_WAITS = 'hali javobingizni kutyapti';

// The driver did not answer a request: halfway to its deadline the bot asks once more (docs/122).
describe('a request waits for the driver (G68, docs/122)', () => {
  it('rings once halfway to the deadline, under the request itself', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const trip = { from: '1726273', to: '1718401', departAt: START + 10 * HOUR, seats: 3, price: 90_000 };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    const ask = telegram
      .sentTo(DRIVER)
      .find((sent) => JSON.stringify(sent.body).includes(`ask:${booking.id}`));
    const waiting = () =>
      telegram.sentTo(DRIVER).filter((sent) => String(sent.body.text).includes(STILL_WAITS));
    vi.setSystemTime(START + 4 * HOUR);
    await sendReminders(testEnv, Date.now());
    expect(waiting()).toEqual([]);
    vi.setSystemTime(START + 5 * HOUR + 60_000);
    await sendReminders(testEnv, Date.now());
    await sendReminders(testEnv, Date.now());
    expect(waiting()).toHaveLength(1);
    expect(waiting()[0]?.body.reply_parameters).toMatchObject({ message_id: ask?.id });
    expect(waiting()[0]?.body.text).toMatch(
      /^⏳ .+ hali javobingizni kutyapti: \d\d:\d\d gacha javob bering$/u,
    );
  });
});
