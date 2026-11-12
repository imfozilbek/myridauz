import { toCyrillic } from '@platform/i18n';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram } from './test-bot';

const APPROVED = 62;
const APPLICANT = 63;
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
vi.mock('../modules/drivers', async (actual) => ({
  ...(await actual<typeof import('../modules/drivers')>()),
  approvedCar: async (_env: unknown, userId: number) => (userId === APPROVED ? car : null),
}));

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const open = (person: number) => ({
  callback_query: {
    id: 'q',
    from: { id: person },
    data: 'help:t:application:driver',
    message: { message_id: 300, chat: { id: person } },
  },
});
type Rows = { inline_keyboard: { text: string }[][] };
const questions = () =>
  ((telegram.calls.at(-1)?.body.reply_markup as Rows).inline_keyboard ?? []).flat().map((one) => one.text);

// An approved driver sees in the bot what the Mini App shows (docs/231): of the application only the
// change of the car; a driver still waiting sees every question of it.
describe('the topic «Ariza va mashina» in the bot', () => {
  it('leaves an approved driver only the change of the car', async () => {
    await send('driver', open(APPROVED));
    const approved = questions();
    expect(approved).toContain(toCyrillic('Mashinamni qanday almashtiraman?'));
    expect(approved).not.toContain(toCyrillic('Arizaga nima kerak?'));
    await send('driver', open(APPLICANT));
    expect(questions()).toContain(toCyrillic('Arizaga nima kerak?'));
  });
});
