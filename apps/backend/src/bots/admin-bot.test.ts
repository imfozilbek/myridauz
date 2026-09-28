import { afterAll, describe, expect, it, vi } from 'vitest';
import { teamRole } from '../modules/team';
import { call, registerUser } from '../test-api';
import { botEnv, botSender, fakeTelegram, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const PERSON = 55;
const OWNER = 7;
const APPLICANT = 31;
const reply = async (response: Response) => (await response.json()) as { text?: string; method?: string };
const press = (fromId: number, data: string) => ({
  callback_query: {
    id: 'q',
    from: { id: fromId, first_name: 'Owner' },
    data,
    message: { message_id: 9, chat: { id: fromId } },
  },
});

describe('admin bot: support (docs/02)', () => {
  it('copies a message to every team member and sends the answer back', async () => {
    expect((await reply(await send('admin', textMessage(PERSON, 'Savolim bor')))).text).toContain(
      'qabul qilindi',
    );
    const copy = telegram.sentTo(OWNER).find((sent) => String(sent.body.text).includes('Savolim bor'));
    expect(copy?.body.reply_markup).toBeDefined();
    expect(telegram.sentTo(8).length).toBeGreaterThan(0);
    expect((await reply(await send('admin', textMessage(OWNER, 'Mana javob', copy?.id)))).text).toBe(
      'Javob yuborildi.',
    );
    expect(telegram.sentTo(PERSON).at(-1)?.body.text).toContain('Mana javob');
    expect(await reply(await send('admin', textMessage(OWNER, 'Boshqa', 12345)))).toEqual({});
    const photo = { message: { message_id: 2, chat: { id: PERSON }, from: { id: PERSON } } };
    expect((await reply(await send('admin', photo))).text).toContain('faqat matnli');
  });
});

describe('admin bot: the team (docs/02, question 36)', () => {
  it('lets only an owner add and remove moderators', async () => {
    expect((await reply(await send('admin', press(OWNER, `team:add:${PERSON}`)))).text).toBe(
      'Moderator qoʻshildi.',
    );
    expect(await teamRole(botEnv, PERSON)).toBe('moderator');
    expect((await reply(await send('admin', textMessage(OWNER, '/team')))).text).toContain('Moderator: ');
    expect((await reply(await send('admin', textMessage(PERSON, '/team')))).text).toBe(
      'Buni faqat egasi qila oladi.',
    );
    expect((await reply(await send('admin', press(PERSON, 'team:remove:8')))).text).toBe(
      'Buni faqat egasi qila oladi.',
    );
    expect((await reply(await send('admin', press(OWNER, `team:remove:${PERSON}`)))).text).toBe(
      'Moderator olib tashlandi.',
    );
    expect(await teamRole(botEnv, PERSON)).toBeNull();
  });
});

describe('admin bot: the moderation card (docs/04)', () => {
  it('rejects with a chosen reason and tells the driver in the driver bot', async () => {
    await registerUser(APPLICANT);
    await call('/me/avatar', APPLICANT, {
      method: 'PUT',
      body: new Uint8Array(9),
      headers: { 'content-type': 'image/jpeg' },
    });
    for (const kind of ['front', 'side', 'interior']) {
      const photo = {
        method: 'PUT',
        app: 'driver',
        body: new Uint8Array(9),
        headers: { 'content-type': 'image/jpeg' },
      };
      await call(`/driver/application/photos/${kind}`, APPLICANT, photo);
    }
    const car = {
      make: 'Chevrolet',
      model: 'Nexia',
      color: 'black',
      year: 2018,
      plate: '10 123 ABC',
      seats: 4,
    };
    await call('/driver/application', APPLICANT, {
      method: 'POST',
      app: 'driver',
      body: JSON.stringify(car),
      headers: { 'content-type': 'application/json' },
    });
    expect(await reply(await send('admin', press(OWNER, `mod:${APPLICANT}:reject`)))).toEqual({
      method: 'answerCallbackQuery',
      callback_query_id: 'q',
    });
    expect(telegram.calls.at(-1)?.method).toBe('editMessageReplyMarkup');
    await send('admin', press(OWNER, `mod:${APPLICANT}:menu`));
    const decided = await reply(
      await send('admin', press(OWNER, `mod:${APPLICANT}:reject:plate_not_readable`)),
    );
    expect(decided.text).toBe('Rad etildi: Davlat raqami oʻqilmaydi');
    expect(telegram.sentTo(APPLICANT).at(-1)?.body.text).toContain('Davlat raqami oʻqilmaydi');
    const again = await reply(await send('admin', press(OWNER, `mod:${APPLICANT}:approve`)));
    expect(again.text).toBe('Bu arizaga javob berilgan.');
  });

  it('ignores buttons of strangers and broken buttons', async () => {
    expect(
      (await reply(await send('admin', press(PERSON, `mod:${APPLICANT}:approve`)))).text,
    ).toBeUndefined();
    for (const data of ['mod:x:approve', 'mod:1:fly', 'mod:1:reject:bad', 'team:fly:1']) {
      expect((await reply(await send('admin', press(OWNER, data)))).text).toBeUndefined();
    }
    expect(await reply(await send('passenger', press(OWNER, `mod:${APPLICANT}:approve`)))).toEqual({});
  });
});
