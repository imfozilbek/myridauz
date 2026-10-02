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

// A person writes to the support bot, the team answers in the admin bot (docs/50, G30).
describe('the support bot', () => {
  it('greets, copies the question to the team in the admin bot and brings the answer back', async () => {
    expect((await reply(await send('support', textMessage(PERSON, '/start')))).text).toContain(
      'yordam xizmati',
    );
    expect((await reply(await send('support', textMessage(PERSON, 'Pulim qaytmadi')))).text).toContain(
      'qabul qilindi',
    );
    const copy = telegram.sentTo(OWNER).find((sent) => String(sent.body.text).includes('Pulim qaytmadi'));
    expect(copy?.token).toBe(ADMIN_TOKEN);
    // A copy is only the question: the team is changed in /team, not under a question (G30).
    expect(copy?.body.reply_markup).toBeUndefined();
    // Only the assigned member gets it (docs/92): the second owner has nothing of this person.
    expect(telegram.sentTo(8).some((sent) => String(sent.body.text).includes('Pulim qaytmadi'))).toBe(false);
    await send('support', textMessage(57, 'Boshqa savol'));
    expect(telegram.sentTo(8).some((sent) => String(sent.body.text).includes('Boshqa savol'))).toBe(true);
    expect((await reply(await send('admin', textMessage(OWNER, 'Qaytardik', copy?.id)))).text).toBe(
      'Javob yuborildi.',
    );
    const answer = telegram.sentTo(PERSON).at(-1);
    expect(answer?.body.text).toContain('Qaytardik');
    expect(answer?.token).toBe(SUPPORT_TOKEN);
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
    expect(String(answer?.body.caption)).toContain('jamoasidan');
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
