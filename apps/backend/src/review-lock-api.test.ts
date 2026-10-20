import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { botSender, fakeTelegram } from './bots/test-bot';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const { t } = createI18n(DEFAULT_LOCALE);
const DRIVER = 891;
const PASSENGER = 892;
const HOUR = 3_600_000;
const bot = botSender(telegram.fetch);
const botEnv = { ...testEnv, TELEGRAM_WEBHOOK_SECRET: 'hook' };
const press = (data: string) => ({
  callback_query: {
    id: 'q',
    from: { id: PASSENGER, first_name: 'Aziz' },
    data,
    message: { message_id: 5, chat: { id: PASSENGER } },
  },
});

async function rideOver() {
  await approvedDriver(DRIVER);
  await registerUser(PASSENGER);
  const way = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * HOUR, seats: 2, price: 90_000 };
  const trip = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
    }),
  );
  const booking = await read<{ id: string }>(
    call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
  );
  await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 20 * HOUR);
  return booking.id;
}

// G89 A7 (owner decision 20.10.2026): the driver gave 2 stars, Aziz gave 5; both show. Aziz cannot
// change his 5 to 1 in the app or from the old bot message: revenge is what the blind rule stops.
describe('a published review over the API', () => {
  it('answers «reviews.published» to the app and its text to the bot button', async () => {
    const bookingId = await rideOver();
    await call('/reviews', PASSENGER, json({ bookingId, stars: 5 }));
    await call('/reviews', DRIVER, { app: 'driver', ...json({ bookingId, stars: 2 }) });
    const again = await call('/reviews', PASSENGER, json({ bookingId, stars: 1 }));
    expect([again.status, await again.json()]).toEqual([409, { error: 'reviews.published' }]);
    const answer = await bot('passenger', press(`rate:${bookingId}:1`), 'hook', botEnv);
    expect(await answer.json()).toMatchObject({ text: t('errors.reviews.published') });
    const mine = await read<{ mine: { stars: number } }>(call(`/reviews/${bookingId}`, PASSENGER));
    expect(mine.mine.stars).toBe(5);
  });
});
