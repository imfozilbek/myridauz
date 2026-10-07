import { afterAll, describe, expect, it, vi } from 'vitest';
import { call, registerUser } from '../test-api';
import { botSender, fakeTelegram } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const OWNER = 7;
const PERSON = 41;
const reply = async (response: Response) => (await response.json()) as { text?: string };
const press = (data: string, fromId = OWNER) => ({
  callback_query: {
    id: 'q',
    from: { id: fromId, first_name: 'Owner' },
    data,
    message: { message_id: 9, chat: { id: fromId } },
  },
});
const photo = { method: 'PUT', body: new Uint8Array(9), headers: { 'content-type': 'image/jpeg' } };

describe('admin bot: the card of a new face photo (docs/120, G51)', () => {
  it('shows the reasons, says no with one and tells the person in the passenger bot', async () => {
    await registerUser(PERSON);
    await call('/me/avatar', PERSON, photo);
    await send('admin', press(`face:${PERSON}:no`));
    const reasons = JSON.stringify(telegram.calls.at(-1)?.body);
    expect(reasons).toContain('Rasmda bitta odam emas');
    expect(reasons).toContain(`face:${PERSON}:no:1`);
    await send('admin', press(`face:${PERSON}:menu`));
    expect(JSON.stringify(telegram.calls.at(-1)?.body)).toContain('Mos emas');
    const decided = await reply(await send('admin', press(`face:${PERSON}:no:1`)));
    expect(decided.text).toBe('Rad etildi: Rasmda bitta odam emas');
    const edited = telegram.calls.find((sent) => sent.method === 'editMessageCaption');
    expect(edited?.body.caption).toContain('Rad etildi: Rasmda bitta odam emas (Owner)');
    expect(telegram.sentTo(PERSON).at(-1)?.body.text).toContain('Sababi: Rasmda bitta odam emas.');
    const again = await reply(await send('admin', press(`face:${PERSON}:ok`)));
    expect(again.text).toBe('Bu rasmga javob berilgan.');
  });

  it('approves a new photo with «Rasm mos»', async () => {
    await call('/me/avatar', PERSON, photo);
    expect((await reply(await send('admin', press(`face:${PERSON}:ok`)))).text).toBe('Tasdiqlandi');
  });

  it('ignores broken buttons and strangers', async () => {
    for (const data of ['face:x:ok', 'face:1:fly', 'face:1:no:9', 'face:1:no:1:2', 'face:1:ok:1']) {
      expect((await reply(await send('admin', press(data)))).text).toBeUndefined();
    }
    expect((await reply(await send('admin', press(`face:${PERSON}:ok`, 55)))).text).toBeUndefined();
  });
});
