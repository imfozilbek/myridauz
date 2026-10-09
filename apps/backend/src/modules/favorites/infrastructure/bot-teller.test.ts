import { loadBrand } from '@platform/brands';
import type { News } from '../../notifications';
import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { favoriteTeller } from './bot-teller';

// 2026-10-01 10:00 in Tashkent; the trip goes the next morning at 07:30.
const NOW = Date.parse('2026-10-01T05:00:00Z');
const trip = {
  id: 't1',
  from: '1726',
  to: '1730',
  departAt: Date.parse('2026-10-02T02:30:00Z'),
  seatsLeft: 2,
  price: 90_000,
  driver: { firstName: 'Jasur' },
} as Trip;

// A new trip of a saved driver: a line with ♥ in the news card of its route (docs/18, G68).
describe('news of a saved driver (docs/125 №11, G68)', () => {
  it('go to every passenger who saved the driver, as a line with a heart', async () => {
    const shown: News[] = [];
    const tell = favoriteTeller({
      brand: loadBrand(),
      placeName: async (id) => id,
      show: async (news) => void shown.push(news),
      now: () => NOW,
    });
    await tell([10, 11], trip);
    expect(shown.map((news) => news.chatId)).toEqual([10, 11]);
    expect(shown[0]).toMatchObject({ bot: 'passenger', route: '1726>1730' });
    expect(shown[0]?.line?.text.replace(/\s/gu, ' ')).toBe(
      '♥ Jasur · ertaga 07:30 · 2 joy · <b>90 000 soʻm</b>',
    );
    expect(JSON.stringify(shown[0]?.markup)).toContain('?find=1726_1730_2026-10-02');
  });
});
