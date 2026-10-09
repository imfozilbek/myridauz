import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram, photoMessage, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const PERSON = 61;
const OWNER = 7;
const press = (data: string, messageId: number | undefined) => ({
  callback_query: {
    id: 'q',
    from: { id: OWNER },
    data,
    message: { message_id: messageId, chat: { id: OWNER } },
  },
});
const buttonsOf = (markup: unknown) =>
  ((markup as { inline_keyboard?: { text: string }[][] } | undefined)?.inline_keyboard ?? [])
    .flat()
    .map((b) => b.text);
const copyOf = (words: string) =>
  telegram.calls.find(
    (sent) => String(sent.body.text ?? sent.body.caption).includes(words) && sent.token === 'a',
  );

// A photo in support, and the talk of a person for the next team member (G32).
describe('support: photos and the talk', () => {
  it('takes a photo with its caption and brings back a photo answer of the team', async () => {
    await send('support', photoMessage(PERSON, 'Chek shu'));
    const copy = copyOf('Chek shu');
    expect(copy).toMatchObject({ method: 'sendPhoto', body: { photo: 'file' } });
    expect(String(copy?.body.caption)).toContain('🖼 Rasm');
    await send('admin', photoMessage(OWNER, 'Mana skrinshot', copy?.id));
    const answer = telegram.sentTo(PERSON).at(-1);
    expect(answer).toMatchObject({ method: 'sendPhoto', token: 's' });
    expect(String(answer?.body.caption)).toMatch(/^Operator \d{1,3}: rasm\n\nMana skrinshot$/u);
  });

  it('a person who wrote before comes with «Tarix»: the whole talk, the team as «Operator N»', async () => {
    await send('support', textMessage(PERSON, 'Pulim hali kelmadi'));
    const copy = copyOf('Pulim hali kelmadi');
    expect(buttonsOf(copy?.body.reply_markup)).toEqual(['✍️ Javob berish', '📜 Tarix']);
    await send('admin', press('support:history', copy?.id));
    const talk = String(telegram.sentTo(OWNER).at(-1)?.body.text);
    // The name only, never the Telegram ID (lesson №136).
    expect(talk).toContain('Ali: murojaatlar tarixi');
    expect(talk).not.toMatch(/\b61\b/u);
    expect(talk).toMatch(/Ali: 🖼 Rasm\nChek shu/u);
    expect(talk).toMatch(/Operator \d{1,3}: 🖼 Rasm\nMana skrinshot/u);
    expect(talk).toContain('Ali: Pulim hali kelmadi');
  });

  it('a first question has no «Tarix»', async () => {
    await send('support', textMessage(62, 'Birinchi savol'));
    expect(buttonsOf(copyOf('Birinchi savol')?.body.reply_markup)).toEqual(['✍️ Javob berish']);
  });

  it('asks for a text, a photo or a voice when a person sends something else', async () => {
    const sticker = { message: { message_id: 2, chat: { id: PERSON }, from: { id: PERSON } } };
    const reply = (await (await send('support', sticker)).json()) as { text?: string };
    expect(reply.text).toBe('Hozircha faqat matn, rasm yoki ovozli xabar qabul qilinadi.');
  });
});
