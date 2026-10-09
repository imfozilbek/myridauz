import { loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { botEnv as BOT_ENV, botSender, fakeTelegram, textMessage, voiceMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const PERSON = 56;
const OWNER = 7;
const ADMIN_TOKEN = 'a';
const SUPPORT_TOKEN = 's';
const reply = async (response: Response) => (await response.json()) as { text?: string; method?: string };
const brand = loadBrand();

// A person writes to the support bot, the team answers in the admin bot (docs/50, G30).
describe('the support bot', () => {
  it('greets, copies the question to the team in the admin bot and brings the answer back', async () => {
    // The welcome is a picture with the words under it, as in the public bots (owner approval 03.10.2026).
    const welcome = (await (await send('support', textMessage(PERSON, '/start'))).json()) as {
      method: string;
      photo: string;
      caption: string;
    };
    expect(welcome).toMatchObject({
      method: 'sendPhoto',
      photo: `https://${brand.domain}/bot/support-welcome.png`,
    });
    expect(welcome.caption).toContain(`Bu ${brand.name} yordam xizmati.`);
    expect(welcome.caption).toContain('har kuni soat 7:00 dan 23:00 gacha');
    expect((await reply(await send('support', textMessage(PERSON, 'Pulim qaytmadi')))).text).toContain(
      'qabul qilindi',
    );
    const copy = telegram.sentTo(OWNER).find((sent) => String(sent.body.text).includes('Pulim qaytmadi'));
    expect(copy?.token).toBe(ADMIN_TOKEN);
    // Under a card only «Javob berish»: the team is changed in /team, not under a question (G30, G31).
    expect(JSON.stringify(copy?.body.reply_markup)).toBe(
      JSON.stringify({ inline_keyboard: [[{ text: '✍️ Javob berish', callback_data: 'support:reply' }]] }),
    );
    // Only the assigned member gets it (docs/92): the second owner has nothing of this person.
    expect(telegram.sentTo(8).some((sent) => String(sent.body.text).includes('Pulim qaytmadi'))).toBe(false);
    await send('support', textMessage(57, 'Boshqa savol'));
    expect(telegram.sentTo(8).some((sent) => String(sent.body.text).includes('Boshqa savol'))).toBe(true);
    expect((await reply(await send('admin', textMessage(OWNER, 'Qaytardik', copy?.id)))).text).toBe(
      'Javob yuborildi.',
    );
    const answer = telegram.sentTo(PERSON).at(-1);
    expect(answer?.body.text).toMatch(/^Operator \d{1,3}:\n\nQaytardik$/u);
    expect(answer?.token).toBe(SUPPORT_TOKEN);
  });

  it('«Javob berish» asks for the answer; one operator number for the whole question', async () => {
    await send('support', textMessage(PERSON, 'Yana savol'));
    const copy = telegram.sentTo(OWNER).find((sent) => String(sent.body.text).includes('Yana savol'));
    const press = {
      callback_query: {
        id: 'q',
        from: { id: OWNER },
        data: 'support:reply',
        message: { message_id: copy?.id, chat: { id: OWNER } },
      },
    };
    await send('admin', press);
    const prompt = telegram.sentTo(OWNER).at(-1);
    expect(prompt?.body.text).toBe('Javobingizni yozing: matn, rasm yoki ovozli xabar.');
    expect(prompt?.body.reply_markup).toMatchObject({ force_reply: true });
    await send('admin', textMessage(OWNER, 'Birinchi', prompt?.id));
    await send('admin', textMessage(OWNER, 'Ikkinchi', copy?.id));
    const [first, second] = telegram
      .sentTo(PERSON)
      .slice(-2)
      .map((sent) => String(sent.body.text));
    const operator = (text: string | undefined) => /^Operator (\d+):/u.exec(text ?? '')?.[1];
    expect(operator(first)).toBeDefined();
    expect(Number(operator(first))).toBeLessThanOrEqual(200);
    expect(operator(second)).toBe(operator(first));
  });

  it('takes a voice message and brings back a voice answer of the team', async () => {
    expect((await reply(await send('support', voiceMessage(PERSON)))).text).toContain('qabul qilindi');
    const copy = telegram.sentTo(OWNER).at(-1);
    expect(copy).toMatchObject({ method: 'sendVoice', token: ADMIN_TOKEN });
    expect(copy?.body).toMatchObject({ voice: 'file' });
    expect(String(copy?.body.caption)).toContain('Ovozli xabar');
    expect((await reply(await send('admin', voiceMessage(OWNER, copy?.id)))).text).toBe('Javob yuborildi.');
    const answer = telegram.sentTo(PERSON).at(-1);
    expect(answer).toMatchObject({ method: 'sendVoice', token: SUPPORT_TOKEN });
    expect(String(answer?.body.caption)).toMatch(/^Operator \d{1,3}: ovozli javob$/u);
  });

  it('asks for a text or a voice when a person sends something else', async () => {
    const photo = { message: { message_id: 2, chat: { id: PERSON }, from: { id: PERSON } } };
    expect((await reply(await send('support', photo))).text).toContain('ovozli xabar');
  });

  it('is closed without its token and to a wrong secret', async () => {
    const withoutSupport = { ...BOT_ENV, SUPPORT_BOT_TOKEN: undefined };
    expect((await send('support', textMessage(PERSON, 'Salom'), 'hook', withoutSupport)).status).toBe(404);
    expect((await send('support', textMessage(PERSON, 'Salom'), 'wrong')).status).toBe(401);
  });
});
