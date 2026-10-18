import { describe, expect, it } from 'vitest';
import { pid, registerUser } from '../test-api';
import { botSender, fakeTelegram, textMessage } from './test-bot';

const OWNER = 7;
const PERSON = 43;
const STRANGER = 44;
const start = (fromId: number, publicId: string) => textMessage(fromId, `/start profile_${publicId}`);

// Telegram refuses the button to a profile the person hid in its settings (a 400 answer).
function hidingTelegram() {
  const telegram = fakeTelegram();
  const fetch = async (input: string, init?: RequestInit) =>
    String(init?.body).includes('tg://user')
      ? Response.json({ ok: false }, { status: 400 })
      : telegram.fetch(input, init);
  return { ...telegram, fetch };
}

// Owner, 18.10.2026: the team opens the Telegram profile of a person also without a public name.
describe('the Telegram profile of a person for the team', () => {
  it('gives the team the button to the profile in the bot the person knows', async () => {
    const telegram = fakeTelegram();
    await registerUser(PERSON);
    await botSender(telegram.fetch)('driver', start(OWNER, await pid(PERSON)));
    const sent = telegram.sentTo(OWNER).at(-1);
    expect([sent?.method, sent?.token, sent?.body.text]).toEqual([
      'sendMessage',
      'd',
      'Telegram profili: Ali',
    ]);
    expect(JSON.stringify(sent?.body.reply_markup)).toContain(`"url":"tg://user?id=${PERSON}"`);
  });

  it('tells the team when Telegram refuses the profile or the person is gone', async () => {
    const telegram = hidingTelegram();
    const send = botSender(telegram.fetch);
    await send('passenger', start(OWNER, await pid(PERSON)));
    const closed = 'Ali: Telegram bu profilni ochishga ruxsat bermadi.';
    expect(telegram.sentTo(OWNER).at(-1)?.body.text).toBe(closed);
    await send('passenger', start(OWNER, 'f'.repeat(32)));
    expect(telegram.sentTo(OWNER).at(-1)?.body.text).toBe('Odam topilmadi.');
  });

  it('greets anyone else as always', async () => {
    const telegram = fakeTelegram();
    const response = await botSender(telegram.fetch)('passenger', start(STRANGER, await pid(PERSON)));
    expect(telegram.calls).toEqual([]);
    expect(((await response.json()) as { method?: string }).method).toBe('sendPhoto');
  });
});
