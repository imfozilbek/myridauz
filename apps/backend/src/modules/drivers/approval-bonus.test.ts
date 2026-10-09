import { loadBrand } from '@platform/brands';
import type { Card, Ring } from '../notifications';
import { describe, expect, it } from 'vitest';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '30A123BC', seats: 4 } as const;
const APPROVED = { ...emptyApplication(7, 0), status: 'approved' as const, car };
type Buttons = { inline_keyboard: { text: string; url?: string; web_app?: { url: string } }[][] };

// The driver bot names the bonus and until when it lives (docs/89 D4); a driver approved again
// after a new photo got no bonus and hears nothing about it. The answer edits the card of the
// application and rings under it (G68, docs/122).
describe('the approval in the driver bot', () => {
  const message = async (bonus: { amount: number; expiresAt: number } | null, plate: string = car.plate) => {
    const shown: { cards: readonly Card[]; rings: readonly Ring[] }[] = [];
    const notifier = telegramNotifier({
      brand: loadBrand(),
      show: async (cards, rings) => void shown.push({ cards, rings }),
      assign: async () => undefined,
      queue: async () => undefined,
    });
    await notifier.decided({ ...APPROVED, car: { ...car, plate } }, null, bonus);
    const [card] = shown[0]?.cards ?? [];
    return { card, rings: shown[0]?.rings ?? [], buttons: (card?.markup as Buttons).inline_keyboard.flat() };
  };
  const sent = async (bonus: { amount: number; expiresAt: number } | null) =>
    (await message(bonus)).card?.text;

  it('edits the card of the application and rings under it: approved, the car and its plate', async () => {
    const { card, rings } = await message(null);
    expect(card?.key).toBe('application:7');
    expect(card?.text).toContain('✅ Tasdiqlandi');
    expect(card?.text).toContain('<code>30 A 123 BC</code>');
    expect(rings[0]).toMatchObject({ card: 'application:7', text: '✅ Haydovchi arizangiz tasdiqlandi' });
  });

  it('names the amount and the last day of the bonus', async () => {
    const text = await sent({ amount: 500_000, expiresAt: Date.parse('2026-11-01T07:00:00Z') });
    expect(text).toMatch(/Sizga 500\s000\ssoʻm bonus berdik\. U 1-noyabrgacha komissiyaga ishlatiladi\./u);
  });

  it('says nothing about a bonus when none was given', async () => {
    expect(await sent(null)).not.toContain('bonus');
  });

  // The channel of the region of the car and two buttons (G62, docs/119 driver 4).
  it('invites to the channel of the region of the plate and to publish a trip', async () => {
    const { card, buttons } = await message(null);
    const zone = loadBrand().channels.find((channel) => channel.code === '30')?.username;
    expect(card?.text).toContain(`t.me/${zone}`);
    expect(buttons.map((button) => button.text)).toEqual(['Kanalga oʻtish', 'Safar eʼlon qilish']);
    expect(buttons[0]?.url).toBe(`https://t.me/${zone}`);
    expect(buttons[1]?.web_app?.url).toMatch(/\?open=new_trip$/u);
  });

  it('has no channel for a Tashkent car, only «Safar eʼlon qilish»', async () => {
    const { card, buttons } = await message(null, '01A123BC');
    expect(card?.text).not.toContain('t.me/');
    expect(buttons.map((button) => button.text)).toEqual(['Safar eʼlon qilish']);
  });
});
