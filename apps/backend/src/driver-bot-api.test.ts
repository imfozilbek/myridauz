import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);

const DRIVER = 71;
const PASSENGER = 72;
const STRANGER = 73;
const press = (data: string, fromId = DRIVER) => ({
  callback_query: {
    id: 'q',
    from: { id: fromId, first_name: 'Jasur' },
    data,
    message: { message_id: 5, chat: { id: fromId } },
  },
});
const notice = async (response: Response) => ((await response.json()) as { text?: string }).text;

async function asked() {
  const trip = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + 5 * 3_600_000,
    seats: 3,
    price: 90_000,
  };
  const published = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
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
});
