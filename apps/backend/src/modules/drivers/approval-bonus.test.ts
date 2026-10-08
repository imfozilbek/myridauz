import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '30A123BC', seats: 4 } as const;
const APPROVED = { ...emptyApplication(7, 0), status: 'approved' as const, car };
type Sent = {
  readonly text: string;
  readonly reply_markup: { inline_keyboard: { text: string; url?: string; web_app?: { url: string } }[][] };
};

// The driver bot names the bonus and until when it lives (docs/89 D4); a driver approved again
// after a new photo got no bonus and hears nothing about it.
describe('the approval message of the driver bot', () => {
  const message = async (bonus: { amount: number; expiresAt: number } | null, plate: string = car.plate) => {
    const messages: Sent[] = [];
    const notifier = telegramNotifier({
      fetch: async (_url, init) => {
        messages.push(JSON.parse(String(init?.body)) as Sent);
        return new Response(JSON.stringify({ ok: true, result: {} }));
      },
      brand: loadBrand(),
      adminToken: undefined,
      driverToken: 'token',
      recipients: async () => [],
      photos: {} as never,
      people: {} as never,
    });
    await notifier.decided({ ...APPROVED, car: { ...car, plate } }, null, bonus);
    return messages;
  };
  const sent = async (bonus: { amount: number; expiresAt: number } | null) =>
    (await message(bonus)).map((each) => each.text).join('\n');

  it('names the amount and the last day of the bonus', async () => {
    const text = await sent({ amount: 500_000, expiresAt: Date.parse('2026-11-01T07:00:00Z') });
    expect(text).toMatch(/Sizga 500\s000\ssoʻm bonus berdik\. U 1-noyabrgacha komissiyaga ishlatiladi\./u);
  });

  it('says nothing about a bonus when none was given', async () => {
    expect(await sent(null)).not.toContain('bonus');
  });

  // The channel of the region of the car and two buttons (G62, docs/119 driver 4).
  it('invites to the channel of the region of the plate and to publish a trip', async () => {
    const [sentMessage] = await message(null);
    const zone = loadBrand().channels.find((channel) => channel.code === '30')?.username;
    expect(sentMessage?.text).toContain(`t.me/${zone}`);
    const buttons = sentMessage?.reply_markup.inline_keyboard.flat() ?? [];
    expect(buttons.map((button) => button.text)).toEqual(['Kanalga oʻtish', 'Safar eʼlon qilish']);
    expect(buttons[0]?.url).toBe(`https://t.me/${zone}`);
    expect(buttons[1]?.web_app?.url).toMatch(/\?open=new_trip$/u);
  });

  it('has no channel for a Tashkent car, only «Safar eʼlon qilish»', async () => {
    const [sentMessage] = await message(null, '01A123BC');
    expect(sentMessage?.text).not.toContain('t.me/');
    expect(sentMessage?.reply_markup.inline_keyboard.flat().map((button) => button.text)).toEqual([
      'Safar eʼlon qilish',
    ]);
  });
});
