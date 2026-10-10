import { adminWalletAdjustPath, WALLET_PATH } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { call, doorBooking, pid, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);

const DRIVER = 76;
const PASSENGER = 77;
const LEFT = 5_000;
const press = (data: string) => ({
  callback_query: {
    id: 'q',
    from: { id: DRIVER, first_name: 'Jasur' },
    data,
    message: { message_id: 5, chat: { id: DRIVER } },
  },
});

// «Qabul qilish» in the bot without money for the commission (G75, docs/158 Г): besides the short
// notice, a message says how much is missing and opens «Hamyon».
describe('a request answered in the bot without money', () => {
  it('says what is missing and opens the wallet', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const wallet = await read<{ bonus: number }>(call(WALLET_PATH, DRIVER, { app: 'driver' }));
    await call(adminWalletAdjustPath(await pid(DRIVER)), OWNER, {
      app: 'admin',
      ...json({ balance: 'bonus', amount: LEFT - wallet.bonus, reason: 'test' }),
    });
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({
          from: '1726273',
          to: '1718401',
          departAt: Date.now() + 5 * 3_600_000,
          seats: 3,
          price: 90_000,
          womanOnBoard: false,
          pickupMode: 'door',
          comment: '',
        }),
      }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    const notice = await send('driver', press(`ask:${booking.id}:yes`));
    expect(((await notice.json()) as { text?: string }).text).toContain('yetmaydi');
    const told = telegram.sentTo(DRIVER).find((sent) => String(sent.body.text).includes('yetmaydi:'));
    // The commission of one seat at 90 000 is 9 000: 4 000 is missing.
    expect(String(told?.body.text)).toMatch(/4\s000/u);
    expect(JSON.stringify(told?.body.reply_markup)).toContain('open=wallet');
  });
});
