import { loadBrand } from '@platform/brands';
import { HELP_TOPICS, helpQuestions } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const brand = loadBrand();
const PERSON = 61;
type Button = { text: string; callback_data?: string; url?: string };
type Reply = {
  method: string;
  text?: string;
  caption?: string;
  reply_markup?: { inline_keyboard: Button[][] };
};
const reply = async (response: Response) => (await response.json()) as Reply;
const press = (data: string, messageId = 300) => ({
  callback_query: {
    id: 'q',
    from: { id: PERSON },
    data,
    message: { message_id: messageId, chat: { id: PERSON } },
  },
});
const texts = (rows: Button[][] | undefined) => (rows ?? []).flat().map((one) => one.text);
const lastCall = () => telegram.calls.at(-1);

// G97 (docs/226): the help in the bots, one message that changes in place.
describe('the help of the bots', () => {
  it('«/yordam» shows the topics by role, «Boshqa savolim bor» leads to the support bot', async () => {
    const passenger = await reply(await send('passenger', textMessage(PERSON, '/yordam')));
    expect(passenger).toMatchObject({ method: 'sendMessage', text: toCyrillic('Savolingiz qaysi mavzuda?') });
    expect(texts(passenger.reply_markup?.inline_keyboard)).toEqual(
      [
        '🔎 Safar topish',
        '🎫 Joy band qilish',
        '🚗 Haydovchi boʻlish',
        '👛 Hamyon va komissiya',
        '🔒 Hisob va xavfsizlik',
        '✍️ Boshqa savolim bor',
      ].map((text) => toCyrillic(text)),
    );
    expect(passenger.reply_markup?.inline_keyboard.at(-1)?.[0]?.url).toBe(
      `https://t.me/${brand.bots.support}`,
    );
    const driver = await reply(await send('driver', textMessage(PERSON, '/yordam')));
    expect(texts(driver.reply_markup?.inline_keyboard).slice(0, 2)).toEqual([
      toCyrillic('🚗 Haydovchi boʻlish'),
      toCyrillic('👛 Hamyon va komissiya'),
    ]);
    const main = await reply(await send('main', textMessage(PERSON, '/yordam')));
    expect(main.text).toBe(toCyrillic('Savolingiz qaysi mavzuda?'));
  });

  it('a topic and a question change the same message; the numbers come from the brand', async () => {
    await send('driver', press('help:t:wallet'));
    expect(lastCall()).toMatchObject({ method: 'editMessageText', token: 'd' });
    expect(lastCall()?.body).toMatchObject({ chat_id: PERSON, message_id: 300 });
    expect(lastCall()?.body.text).toBe(toCyrillic('«Hamyon va komissiya»: savolni tanlang.'));
    const answered = await reply(await send('driver', press('help:q:wallet.fee')));
    expect(answered.method).toBe('answerCallbackQuery');
    const fee = String(lastCall()?.body.text);
    expect(fee).toContain(toCyrillic('<b>Haydovchi uchun qancha turadi?</b>'));
    expect(fee).toContain(toCyrillic(`narxining ${brand.commission.percent} foizi`));
    expect(texts((lastCall()?.body.reply_markup as Reply['reply_markup'])?.inline_keyboard)).toEqual([
      toCyrillic('⬅️ Mavzular'),
      toCyrillic('✍️ Boshqa savolim bor'),
    ]);
  });

  it('every answer of every topic is filled: no braces are left', async () => {
    for (const topic of HELP_TOPICS)
      for (const question of helpQuestions(topic)) {
        await send('passenger', press(`help:q:${question}`));
        expect(String(lastCall()?.body.text)).not.toMatch(/[{}]/u);
      }
  });

  it('an unknown button only stops the spinner', async () => {
    const before = telegram.calls.length;
    expect((await reply(await send('passenger', press('help:q:find.nope')))).method).toBe(
      'answerCallbackQuery',
    );
    expect(telegram.calls.length).toBe(before);
  });

  it('the support bot shows the topics under its welcome and waits for a question on «Boshqa savolim bor»', async () => {
    const welcome = await reply(await send('support', textMessage(PERSON, '/start')));
    expect(welcome.method).toBe('sendPhoto');
    expect(welcome.caption).toContain(toCyrillic('«Boshqa savolim bor»ni bosing'));
    expect(welcome.reply_markup?.inline_keyboard.at(-1)?.[0]?.callback_data).toBe('help:more');
    await send('support', press('help:q:find.how', 400));
    expect(lastCall()).toMatchObject({ method: 'editMessageCaption', token: 's' });
    expect(String(lastCall()?.body.caption)).toContain(toCyrillic('Safarni qanday topaman?'));
    const ask = await reply(await send('support', press('help:more', 400)));
    expect(ask).toMatchObject({
      method: 'sendMessage',
      text: expect.stringContaining(toCyrillic('shu yerga yozing')),
    });
    expect(lastCall()).toMatchObject({ method: 'answerCallbackQuery', body: { callback_query_id: 'q' } });
  });
});
