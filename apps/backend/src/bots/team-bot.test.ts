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
  const say = async (fromId: number, text: string) =>
    (await reply(await send('admin', textMessage(fromId, text)))).text;
  it('lets only an owner add a moderator by /team add <Telegram ID> and remove them', async () => {
    expect(await say(OWNER, '/team')).toContain('/team add');
    expect(await say(OWNER, `/team add ${PERSON}`)).toBe('Moderator qoʻshildi.');
    expect(await teamRole(botEnv, PERSON)).toBe('moderator');
    expect(await say(OWNER, '/team')).toContain('Moderator: ');
    // Not an id: the owner sees how to write it.
    expect(await say(OWNER, '/team add Ali')).toContain('/team add');
    expect(await say(PERSON, '/team')).toBe('Buni faqat egasi qila oladi.');
    expect(await say(PERSON, '/team add 99')).toBe('Buni faqat egasi qila oladi.');
    expect(await teamRole(botEnv, 99)).toBeNull();
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
