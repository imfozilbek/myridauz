import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { tripArrivePath, tripDepartPath } from '@platform/contracts';
import { completeTrips } from './modules/trips';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const send = botSender(telegram.fetch);

const DRIVER = 71;
const PASSENGER = 72;
const STRANGER = 73;
// A second driver: the first one has a trip at that time already.
const ARRIVING = 74;
const FORGOT = 75;
const press = (data: string, fromId = DRIVER) => ({
  callback_query: {
    id: 'q',
    from: { id: fromId, first_name: 'Jasur' },
    data,
    message: { message_id: 5, chat: { id: fromId } },
  },
});
const notice = async (response: Response) => ((await response.json()) as { text?: string }).text;

async function asked(departIn = 5 * 3_600_000, driverId = DRIVER) {
  const trip = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + departIn,
    seats: 3,
    price: 90_000,
  };
  const published = await read<{ id: string }>(
    call('/driver/trips', driverId, {
      app: 'driver',
      ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
    }),
  );
  const booking = await read<{ id: string }>(
    call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
  );
  return { tripId: published.id, bookingId: booking.id };
}

describe('the driver bot: the trip card and a request answered in the bot (G68, docs/122)', () => {
  it('publishes the trip as a pinned card; a request rings under it and «Qabul qilish» confirms', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    await registerUser(STRANGER);
    const { tripId, bookingId } = await asked();
    const toDriver = telegram.sentTo(DRIVER);
    const card = toDriver.find((sent) => String(sent.body.text).startsWith('<b>📣 Eʼlon qilindi'));
    expect(card?.body.disable_notification).toBe(true);
    expect(toDriver.some((sent) => sent.method === 'pinChatMessage')).toBe(true);
    const ask = toDriver.find((sent) => JSON.stringify(sent.body).includes(`ask:${bookingId}:yes`));
    expect(ask?.body.reply_parameters).toMatchObject({ message_id: card?.id });
    expect(await notice(await send('driver', press(`ask:${bookingId}:yes`, STRANGER)))).toBeUndefined();
    await send('driver', press(`ask:${bookingId}:yes`));
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/driver/bookings', DRIVER, { app: 'driver' }),
    );
    expect(mine.bookings.find((booking) => booking.id === bookingId)?.status).toBe('confirmed');
    const answered = telegram.sentTo(DRIVER).filter((sent) => sent.method === 'editMessageText');
    expect(
      answered.some(
        (sent) => sent.body.message_id === ask?.id && String(sent.body.text).includes('✅ Qabul qilindi'),
      ),
    ).toBe(true);
    expect(answered.some((sent) => sent.body.message_id === card?.id)).toBe(true);
    expect(await notice(await send('driver', press(`ask:${bookingId}:no`)))).toBe(
      'Bu soʻrov allaqachon oʻzgargan.',
    );
    expect(tripId).toBeTruthy();
  });

  it('«Yetib keldik» ends both cards: they say so and leave the top of the chat', async () => {
    await approvedDriver(ARRIVING);
    const { tripId, bookingId } = await asked(90 * 60_000, ARRIVING);
    await send('driver', press(`ask:${bookingId}:yes`, ARRIVING));
    // Half an hour later: «Yoʻlga chiqdim» opens an hour before the time.
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 30 * 60_000 });
    const driver = { method: 'POST', app: 'driver' as const };
    expect((await call(tripDepartPath(tripId), ARRIVING, driver)).status).toBe(200);
    const before = telegram.calls.length;
    expect((await call(tripArrivePath(tripId), ARRIVING, driver)).status).toBe(200);
    const after = telegram.calls.slice(before);
    const arrived = (chatId: number) =>
      after.some(
        (sent) => sent.body.chat_id === chatId && String(sent.body.text).startsWith('<b>🏁 Yetib keldingiz'),
      );
    expect(arrived(ARRIVING)).toBe(true);
    expect(arrived(PASSENGER)).toBe(true);
    const unpinned = after
      .filter((sent) => sent.method === 'unpinChatMessage')
      .map((sent) => sent.body.chat_id);
    expect(unpinned.sort()).toEqual([ARRIVING, PASSENGER].sort());
  });

  it('a trip the Cron closes ends the card too, when the driver forgot «Yetib keldik»', async () => {
    await approvedDriver(FORGOT);
    const { tripId } = await asked(3 * 3_600_000, FORGOT);
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 24 * 3_600_000 });
    const before = telegram.calls.length;
    await completeTrips(testEnv, Date.now());
    const after = telegram.calls.slice(before).filter((sent) => sent.body.chat_id === FORGOT);
    expect(after.some((sent) => String(sent.body.text).startsWith('<b>🏁 Yetib keldingiz'))).toBe(true);
    expect(after.some((sent) => sent.method === 'unpinChatMessage')).toBe(true);
    expect(tripId).toBeTruthy();
  });
});
