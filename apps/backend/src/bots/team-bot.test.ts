import { afterAll, describe, expect, it, vi } from 'vitest';
import { teamRole } from '../modules/team';
import { botEnv, botSender, fakeTelegram, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const PERSON = 57;
const OWNER = 7;
const reply = async (response: Response) => (await response.json()) as { text?: string };
const press = (fromId: number, data: string) => ({
  callback_query: { id: 'q', from: { id: fromId }, data, message: { message_id: 9, chat: { id: fromId } } },
});

describe('admin bot: the team (docs/50)', () => {
  const picked = (fromId: number, userId: number) => ({
    message: {
      message_id: 3,
      chat: { id: fromId },
      from: { id: fromId },
      users_shared: { users: [{ user_id: userId }] },
    },
  });
  it('lets only an owner pick a moderator from Telegram and remove them', async () => {
    const list = (await (await send('admin', textMessage(OWNER, '/team'))).json()) as {
      reply_markup: { inline_keyboard: { text: string; callback_data: string }[][] };
    };
    expect(list.reply_markup.inline_keyboard.at(-1)?.[0]).toEqual({
      text: 'Moderator qoʻshish',
      callback_data: 'team:pick',
    });
    await send('admin', press(OWNER, 'team:pick'));
    const ask = telegram.calls.at(-1);
    expect(ask).toMatchObject({ method: 'sendMessage', token: 'a' });
    expect(JSON.stringify(ask?.body)).toContain('request_users');
    expect((await reply(await send('admin', picked(OWNER, PERSON)))).text).toBe('Moderator qoʻshildi.');
    expect(await teamRole(botEnv, PERSON)).toBe('moderator');
    expect((await reply(await send('admin', textMessage(OWNER, '/team')))).text).toContain('Moderator: ');
    expect((await reply(await send('admin', textMessage(PERSON, '/team')))).text).toBe(
      'Buni faqat egasi qila oladi.',
    );
    expect((await reply(await send('admin', press(PERSON, 'team:pick')))).text).toBe(
      'Buni faqat egasi qila oladi.',
    );
    expect((await reply(await send('admin', picked(PERSON, 99)))).text).toBe('Buni faqat egasi qila oladi.');
    expect((await reply(await send('admin', press(PERSON, 'team:remove:8')))).text).toBe(
      'Buni faqat egasi qila oladi.',
    );
    // The old button under a question is gone: it changes nothing.
    expect((await reply(await send('admin', press(OWNER, 'team:add:99')))).text).toBeUndefined();
    expect((await reply(await send('admin', press(OWNER, `team:remove:${PERSON}`)))).text).toBe(
      'Moderator olib tashlandi.',
    );
    expect(await teamRole(botEnv, PERSON)).toBeNull();
  });
});
