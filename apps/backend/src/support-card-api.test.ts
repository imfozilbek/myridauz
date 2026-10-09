import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { botEnv, botSender, fakeTelegram, textMessage } from './bots/test-bot';
import { call, doorBooking, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-01 10:00 in Tashkent: the team works, a question rings.
const START = Date.parse('2026-10-01T05:00:00Z');
const HOUR = 3_600_000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(START);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const send = botSender(telegram.fetch);
const TEAM = [7, 8];
const DRIVER = 71;
const PASSENGER = 72;
const GUEST = 73;
const copyOf = (words: string) =>
  telegram.calls.find((sent) => sent.token === 'a' && String(sent.body.text).includes(words));
const buttonsOf = (markup: unknown) =>
  ((markup as { inline_keyboard?: { text: string }[][] } | undefined)?.inline_keyboard ?? []).flat();
const fromMember = (id: number, text: string, replyTo: number | undefined) => {
  const update = textMessage(id, text, replyTo) as { message: { from: object } };
  update.message.from = { id, first_name: id === 7 ? 'Aziz' : 'Laylo' };
  return update;
};

async function bookedPassenger() {
  await approvedDriver(DRIVER);
  await registerUser(PASSENGER);
  const trip = { from: '1726273', to: '1718401', departAt: START + 22 * HOUR, seats: 3, price: 90_000 };
  const published = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
    }),
  );
  const seat = await read<{ id: string }>(
    call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
  );
  await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
  return published.id;
}

// The card of a question for the team (G68, docs/122, mockup g68/4 «Yordam boti»).
describe('the card of a support question (G68)', () => {
  it('a passenger: the role, the live booking, the text; never the Telegram ID', async () => {
    const tripId = await bookedPassenger();
    await send('support', textMessage(PASSENGER, 'Haydovchi telefonni olmayapti'), 'hook', botEnv);
    const card = copyOf('Haydovchi telefonni olmayapti');
    const text = String(card?.body.text);
    expect(card?.body.parse_mode).toBe('HTML');
    expect(card?.body).not.toHaveProperty('disable_notification');
    expect(text).toContain('💬 <b>Yangi murojaat</b>');
    expect(text).toMatch(/<b>.+ · yoʻlovchi<\/b>/u);
    expect(text).toContain('📌 Faol bron: ');
    expect(text).toContain('ertaga 08:00');
    expect(text).toContain('«Haydovchi telefonni olmayapti»');
    expect(text).toMatch(/<i>.+ bilan 1 kun · 0 safar<\/i>/u);
    expect(text).not.toMatch(new RegExp(`\\b${PASSENGER}\\b`, 'u'));
    const buttons = buttonsOf(card?.body.reply_markup);
    expect(buttons.map((button) => button.text)).toEqual(['✍️ Javob berish', '📋 Bronni ochish']);
    expect(JSON.stringify(buttons[1])).toContain(`open=trips&trip=${tripId}`);
  });

  it('a person without an account: only the name and «roʻyxatdan oʻtmagan»; quiet at night', async () => {
    // 23:30 in Tashkent: the team rests, the card comes without sound.
    vi.setSystemTime(START + 13.5 * HOUR);
    const night = textMessage(GUEST, 'Qanday yozilaman?') as { message: { from: object } };
    night.message.from = { id: GUEST, first_name: 'Vali' };
    await send('support', night, 'hook', botEnv);
    const card = copyOf('Qanday yozilaman?');
    expect(String(card?.body.text)).toContain('<b>Vali · roʻyxatdan oʻtmagan</b>');
    expect(String(card?.body.text)).not.toMatch(new RegExp(`\\b${GUEST}\\b`, 'u'));
    expect(card?.body.disable_notification).toBe(true);
  });

  it('an answer: the other member with a copy of the person learns it without sound', async () => {
    const first = copyOf('Haydovchi telefonni olmayapti');
    // The next day the same person comes to the other member (docs/92).
    vi.setSystemTime(START + 24 * HOUR);
    await send('support', textMessage(74, 'Salom'), 'hook', botEnv);
    await send('support', textMessage(PASSENGER, 'Yana savol'), 'hook', botEnv);
    const second = copyOf('Yana savol');
    expect(second?.body.chat_id).not.toBe(first?.body.chat_id);
    const answerer = Number(second?.body.chat_id);
    const other = TEAM.find((id) => id !== answerer) ?? 0;
    const sent = await send('admin', fromMember(answerer, 'Haydovchi yoʻlda', second?.id), 'hook', botEnv);
    expect(((await sent.json()) as { text?: string }).text).toBe('Javob yuborildi.');
    const news = telegram.sentTo(other).at(-1);
    expect(news?.body.text).toBe(`✅ Operator ${answerer === 7 ? 'Aziz' : 'Laylo'} javob berdi`);
    expect(news?.body.disable_notification).toBe(true);
    expect(news?.body.reply_parameters).toMatchObject({ message_id: first?.id });
  });
});
