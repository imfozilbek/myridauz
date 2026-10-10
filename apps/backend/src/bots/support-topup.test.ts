import { afterAll, describe, expect, it, vi } from 'vitest';
import { botSender, fakeTelegram, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const DRIVER = 58;
const reply = async (response: Response) => (await response.json()) as { text?: string };

// «Hisobni toʻldirish» before the payments (G75, docs/124 Г): the support bot opens with
// start=topup and the question goes to the team at once, with its words ready.
describe('«Hisobni toʻldirish» in the support bot', () => {
  it('sends the ready question to the team and says it is received', async () => {
    expect((await reply(await send('support', textMessage(DRIVER, '/start topup')))).text).toContain(
      'qabul qilindi',
    );
    const copies = telegram.sentTo(7).concat(telegram.sentTo(8));
    expect(copies.some((sent) => String(sent.body.text).includes('Hamyonimni toʻldirmoqchiman.'))).toBe(true);
  });
});
