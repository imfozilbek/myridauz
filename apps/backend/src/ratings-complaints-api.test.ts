import { afterAll, describe, expect, it, vi } from 'vitest';
import { json, OWNER, approvedDriver, read } from './bookings-test-api';
import { botSender } from './bots/test-bot';
import { askForRatings } from './modules/ratings';
import { signTelegramData } from './shared/auth/test-signing';
import { call, nowSeconds, pid, registerUser, testEnv, doorBooking } from './test-api';

// Every Telegram call of the flow: questions, answers to buttons, the team signal.
const telegram: { method: string; body: Record<string, unknown> }[] = [];
const fetchStub = async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ method: input.split('/').pop() ?? '', body });
  return Response.json({ ok: true, result: { message_id: 5 } });
};
vi.stubGlobal('fetch', fetchStub);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 81;
const PASSENGER = 82;
const OTHER = 83;
const NEW_ACCOUNT = 84;
const HOUR = 3_600_000;
const bot = botSender(fetchStub);
const botEnv = { ...testEnv, TELEGRAM_WEBHOOK_SECRET: 'hook' };
const trip = (departAt: number) =>
  json({
    from: '1726273',
    to: '1718401',
    departAt,
    seats: 2,
    price: 90_000,
    womanOnBoard: false,
    pickupMode: 'both',
    comment: '',
  });
const press = (fromId: number, data: string) => ({
  callback_query: {
    id: 'q',
    from: { id: fromId, first_name: 'Ali' },
    data,
    message: { message_id: 5, chat: { id: fromId } },
  },
});

async function ride(passengerId: number, departAt: number) {
  const published = await read<{ id: string }>(
    call('/driver/trips', DRIVER, { app: 'driver', ...trip(departAt) }),
  );
  const booking = await read<{ id: string }>(
    call(`/trips/${published.id}/bookings`, passengerId, json(doorBooking(1))),
  );
  await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
  return { tripId: published.id, bookingId: booking.id };
}

describe('ratings and complaints through the API (docs/17, docs/24)', () => {
  it('asks for stars after the ride, keeps reviews blind, then a complaint blocks by ID and phone', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    await registerUser(OTHER);
    const { bookingId } = await ride(PASSENGER, Date.now() + 5 * HOUR);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 20 * HOUR);
    telegram.length = 0;
    await askForRatings(testEnv);
    const asked = telegram.filter((item) => item.method === 'sendMessage').map((item) => item.body.chat_id);
    expect(asked).toEqual([PASSENGER, DRIVER]);
    const answer = await bot('passenger', press(PASSENGER, `rate:${bookingId}:2`), 'hook', botEnv);
    expect(await answer.json()).toEqual({ method: 'answerCallbackQuery', callback_query_id: 'q' });
    const thanks = telegram.find((item) => item.method === 'editMessageText');
    expect(JSON.stringify(thanks?.body)).toContain(`complain=${bookingId}`);
    const target = await read<{ rateeRole: string; mine: { stars: number } }>(
      call(`/reviews/${bookingId}`, PASSENGER),
    );
    expect(target).toMatchObject({ rateeRole: 'driver', mine: { stars: 2 } });
    await call(
      '/reviews',
      PASSENGER,
      json({ bookingId, stars: 2, tags: ['on_time'], text: 'Tel: 998901112233' }),
    );
    expect(
      (await read<{ reviews: unknown[] }>(call(`/users/${await pid(DRIVER)}/reviews`, OTHER))).reviews,
    ).toEqual([]);
    await call('/reviews', DRIVER, { app: 'driver', ...json({ bookingId, stars: 5 }) });
    const shown = await read<{ reviews: { text: string }[] }>(
      call(`/users/${await pid(DRIVER)}/reviews`, OTHER),
    );
    expect(shown.reviews.map((item) => item.text)).toEqual(['Tel: ***']);

    const upcoming = await ride(OTHER, Date.now() + 30 * HOUR);
    telegram.length = 0;
    const filed = await call(
      '/complaints',
      PASSENGER,
      json({ bookingId, reason: 'harassment', comment: 'Qoʻpol' }),
    );
    expect(filed.status).toBe(201);
    expect((await call('/complaints', PASSENGER, json({ bookingId, reason: 'other' }))).status).toBe(409);
    expect(telegram.some((item) => item.body.chat_id === OWNER)).toBe(true);
    expect((await call('/admin/complaints', PASSENGER, { app: 'admin' })).status).toBe(403);
    const queue = await read<{ complaints: { id: string; high: boolean }[] }>(
      call('/admin/complaints', OWNER, { app: 'admin' }),
    );
    const id = queue.complaints[0]?.id ?? '';
    expect(queue.complaints[0]?.high).toBe(true);
    expect((await call(`/admin/complaints/${id}/chat`, OWNER, { method: 'POST', app: 'admin' })).status).toBe(
      200,
    );
    const decision = json({ action: 'block', days: null });
    expect(
      (await call(`/admin/complaints/${id}/decision`, OWNER, { app: 'admin', ...decision })).status,
    ).toBe(204);
    expect(await (await call('/me', DRIVER, { app: 'driver' })).json()).toEqual({
      state: 'blocked',
      until: null,
    });
    const cancelled = await read<{ status: string }>(call(`/trips/${upcoming.tripId}`, OTHER));
    expect(cancelled.status).toBe('cancelled');

    const contact = await signTelegramData(
      testEnv.PASSENGER_BOT_TOKEN,
      { contact: { user_id: NEW_ACCOUNT, phone_number: `99890${DRIVER}` } },
      nowSeconds(),
    );
    const body = { consent: true, firstName: 'Ali', gender: 'male', contact };
    // A new Telegram account with the phone of the blocked person cannot register (docs/17).
    const again = await call('/me/registration', NEW_ACCOUNT, json(body));
    expect(again.status).toBe(403);
    expect(await again.json()).toMatchObject({ error: 'users.blocked' });
  });
});
