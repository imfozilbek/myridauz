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

// Driver applications are decided in the admin app only; the bot holds «Navbat» of the team, a card
// with the cases that wait, the oldest one and a ring when work comes to an empty queue (G68).
describe('admin bot: «Navbat» of the team (G68, docs/122)', () => {
  const TEAM_OWNER = 900;
  const toOwner = () => telegram.sentTo(TEAM_OWNER);
  const lastCard = () =>
    String(
      toOwner()
        .filter((sent) => String(sent.body.text).includes('Navbat'))
        .at(-1)?.body.text,
    );

  it('counts the application, rings once for the empty queue, empties after the decision in the app', async () => {
    await registerUser(APPLICANT);
    const jpeg = { body: new Uint8Array(9), headers: { 'content-type': 'image/jpeg' } };
    await call('/me/avatar', APPLICANT, { method: 'PUT', ...jpeg });
    for (const kind of ['front', 'side', 'interior'])
      await call(`/driver/application/photos/${kind}`, APPLICANT, { method: 'PUT', app: 'driver', ...jpeg });
    const car = { make: 'Chevrolet', model: 'Nexia', color: 'black', plate: '10 123 ABC', seats: 4 };
    await call('/driver/application', APPLICANT, {
      method: 'POST',
      app: 'driver',
      body: JSON.stringify(car),
      headers: { 'content-type': 'application/json' },
    });
    expect(lastCard()).toContain('Navbat · 2 ta ish');
    expect(lastCard()).toContain('1 ariza · 0 shikoyat · 1 rasm');
    expect(toOwner().some((sent) => sent.method === 'pinChatMessage')).toBe(true);
    const rings = toOwner().filter((sent) => String(sent.body.text).includes('Yangi ish keldi'));
    expect(rings).toHaveLength(1);
    // No album and no buttons of a decision in the bot.
    expect(toOwner().some((sent) => sent.method === 'sendMediaGroup')).toBe(false);
    expect(JSON.stringify(toOwner())).not.toContain('mod:');
    const decision = { action: 'reject', reasons: ['plate_not_readable'] };
    await call(`/admin/applications/${await pid(APPLICANT)}/decision`, TEAM_OWNER, {
      method: 'POST',
      app: 'admin',
      body: JSON.stringify(decision),
      headers: { 'content-type': 'application/json' },
    });
    expect(lastCard()).toContain('Navbat · 1 ta ish');
    expect(lastCard()).toContain('0 ariza · 0 shikoyat · 1 rasm');
    // The answer still reaches the driver in the card of the application (G68).
    expect(telegram.sentTo(APPLICANT).at(-1)?.body.text).toBe('❌ Haydovchi arizangiz rad etildi');
  });

  it('an old card of an application only stops the spinner; strangers and other bots too', async () => {
    for (const data of [`mod:${APPLICANT}:approve`, 'mod:1:reject:12:send', 'team:fly:1'])
      expect((await reply(await send('admin', press(OWNER, data)))).text).toBeUndefined();
    expect(
      (await reply(await send('admin', press(PERSON, `mod:${APPLICANT}:approve`)))).text,
    ).toBeUndefined();
    expect(await reply(await send('passenger', press(OWNER, `mod:${APPLICANT}:approve`)))).toEqual({
      method: 'answerCallbackQuery',
      callback_query_id: 'q',
    });
  });
});
