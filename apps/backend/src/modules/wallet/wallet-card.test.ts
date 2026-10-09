import { loadBrand } from '@platform/brands';
import type { Wallet } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { walletCard, walletRing } from './infrastructure/wallet-card';

const NOW = Date.parse('2026-10-01T05:00:00Z');
const ENDS = Date.parse('2026-10-04T05:00:00Z');
// The sums have a narrow space between the thousands: plain spaces read easier here.
const plain = (text: string) => text.replace(/\s/gu, ' ');
const wallet = (bonus: number, main: number, seatsLeft: number | null): Wallet => ({
  bonus,
  main,
  bonusExpiresAt: bonus > 0 ? ENDS : null,
  seatsLeft,
  operations: [],
});

// The wallet card of the driver bot and its news (G68, docs/122): the ring says by itself what
// happened, the lock screen shows only it.
describe('the wallet card of the driver bot (G68, docs/122)', () => {
  it('shows the bonus with its last day, the main money, the seats and opens «Hamyon»', () => {
    const card = walletCard(loadBrand(), 7, wallet(36_000, 0, 4), NOW);
    expect(card).toMatchObject({ bot: 'driver', chatId: 7, key: 'wallet:7' });
    expect(plain(card.text)).toContain('Bonus: <b>36 000 soʻm</b> · 4-oktabrgacha');
    expect(plain(card.text)).toContain('Asosiy hisob: <b>0 soʻm</b>');
    expect(plain(card.text)).toContain('≈ 4 ta joyga yetadi');
    expect(JSON.stringify(card.markup)).toContain('?open=wallet');
  });

  it('leaves out the bonus line without a bonus and the seats without a trip yet', () => {
    const { text } = walletCard(loadBrand(), 7, wallet(0, 20_000, null), NOW);
    expect(text).not.toContain('Bonus');
    expect(text).not.toContain('joyga yetadi');
  });

  it('rings under the card: few seats, no money, the bonus ends', () => {
    const few = walletRing(7, wallet(36_000, 0, 4), 'fewSeats', false);
    expect(few).toMatchObject({ bot: 'driver', chatId: 7, card: 'wallet:7', quiet: false });
    expect(few.text).toBe('💳 Hamyoningizdagi pul faqat 4 ta joyga yetadi');
    expect(walletRing(7, wallet(0, 0, 0), 'fewSeats', true).text).toBe(
      '💳 Hamyoningizda komissiya uchun pul qolmadi',
    );
    expect(plain(walletRing(7, wallet(45_000, 0, 5), 'bonusEnds', true).text)).toBe(
      '🎁 Bonusingiz 4-oktabr kuni tugaydi: 45 000 soʻm qoldi',
    );
  });
});
