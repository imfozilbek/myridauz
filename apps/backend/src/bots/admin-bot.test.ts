import { loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { call, pid, registerUser } from '../test-api';
import { botSender, fakeTelegram, textMessage } from './test-bot';

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

describe('admin bot: not a support desk (docs/50)', () => {
  it('sends a person outside the team to the support bot and copies nothing to the team', async () => {
    const before = telegram.calls.length;
    const answer = (await (await send('admin', textMessage(PERSON, 'Savolim bor'))).json()) as {
      text: string;
      reply_markup: { inline_keyboard: { url: string }[][] };
    };
    expect(answer.text).toContain('yordam xizmatiga yozing');
    expect(answer.reply_markup.inline_keyboard[0]?.[0]?.url).toBe(`https://t.me/${loadBrand().bots.support}`);
    expect(telegram.calls.length).toBe(before);
    // A reply of the team to a message that is no copy is silent.
    expect(await reply(await send('admin', textMessage(OWNER, 'Boshqa', 12345)))).toEqual({});
  });
});

describe('admin bot: the moderation card (docs/04)', () => {
  it('rejects with ticked reasons and tells the driver in the driver bot', async () => {
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
    // Bits: 4 = plate_not_readable, 8 = side_unclear (their places in MODERATION_REASONS).
    await send('admin', press(OWNER, `mod:${APPLICANT}:reject:4`));
    expect(JSON.stringify(telegram.calls.at(-1)?.body)).toContain('✅ Rasmda davlat raqami oʻqilmaydi');
    const empty = await reply(await send('admin', press(OWNER, `mod:${APPLICANT}:reject:0:send`)));
    expect(empty.text).toBe('Kamida bitta sababni tanlang.');
    const decided = await reply(await send('admin', press(OWNER, `mod:${APPLICANT}:reject:12:send`)));
    expect(decided.text).toBe(
      'Rad etildi: Rasmda davlat raqami oʻqilmaydi, Yon tomondan olingan rasm tiniq emas',
    );
    // The card of the application lists the reasons; the answer rings under it (G68, docs/122).
    const told = telegram.sentTo(APPLICANT).map((sent) => String(sent.body.text));
    expect(
      told.some((text) =>
        text.includes('• Rasmda davlat raqami oʻqilmaydi\n• Yon tomondan olingan rasm tiniq emas'),
      ),
    ).toBe(true);
    expect(told.at(-1)).toBe('❌ Haydovchi arizangiz rad etildi');
    // "Tasdiqlash" first asks to compare the plate; the fix opens the admin Mini App on this application.
    const check = await reply(await send('admin', press(OWNER, `mod:${APPLICANT}:approve`)));
    expect(check.text).toBe('Rasmdagi davlat raqamini kartadagi raqam bilan solishtiring.');
    expect(JSON.stringify(telegram.calls.at(-1)?.body)).toContain(`?application=${await pid(APPLICANT)}`);
    const again = await reply(await send('admin', press(OWNER, `mod:${APPLICANT}:approve:ok`)));
    expect(again.text).toBe('Bu arizaga javob berilgan.');
  });

  it('ignores buttons of strangers and broken buttons', async () => {
    expect(
      (await reply(await send('admin', press(PERSON, `mod:${APPLICANT}:approve`)))).text,
    ).toBeUndefined();
    for (const data of [
      'mod:x:approve',
      'mod:1:fly',
      'mod:1:reject:bad',
      'mod:1:reject:999:send',
      'team:fly:1',
    ]) {
      expect((await reply(await send('admin', press(OWNER, data)))).text).toBeUndefined();
    }
    // Other bots only stop the spinner of a button they do not know: no moderation there.
    expect(await reply(await send('passenger', press(OWNER, `mod:${APPLICANT}:approve`)))).toEqual({
      method: 'answerCallbackQuery',
      callback_query_id: 'q',
    });
  });
});
