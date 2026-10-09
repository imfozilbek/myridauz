import { loadBrand } from '@platform/brands';
import type { News } from '../../notifications';
import { describe, expect, it } from 'vitest';
import type { Match, SubscriptionRecord } from '../domain/subscription';
import { botTeller } from './bot-teller';

// 2026-10-01 10:00 in Tashkent.
const NOW = Date.parse('2026-10-01T05:00:00Z');
const subscription: SubscriptionRecord = {
  id: 's1',
  userId: 10,
  kind: 'trips',
  from: '1726',
  to: '1730',
  date: null,
  woman: false,
  expiresAt: 0,
  expired: false,
  createdAt: 0,
};
const match: Match = {
  id: 't1',
  ownerId: 9,
  from: '1726269',
  to: '1730',
  date: '2026-10-02',
  woman: false,
  name: 'Jasur',
  time: '07:30',
  seats: 2,
  price: 90_000,
  wholeCar: false,
};
const NAMES: Record<string, string> = { '1726': 'Toshkent', '1730': 'Urgut', '1726269': 'Chilonzor' };

function teller() {
  const shown: News[] = [];
  const tell = botTeller({
    brand: loadBrand(),
    placeName: async (id) => NAMES[id] ?? id,
    show: async (news) => void shown.push(news),
    now: () => NOW,
  });
  return { tell, shown };
}
const plain = (text: string) => text.replace(/\s/gu, ' ');
const buttons = (news: News | undefined) => JSON.stringify(news?.markup);

// The news of a subscription live in the news card of its route (G68, docs/122 rule 4).
describe('the news card of a subscription (G68, docs/122 rule 4)', () => {
  it('a passenger: the trip as a line, «Hammasini koʻrish» and «Bu yoʻnalish kerak emas»', async () => {
    const { tell, shown } = teller();
    await tell.one(subscription, match);
    await tell.cheaper(subscription, { ...match, price: 85_000 });
    const [news, cheaper] = shown;
    expect(news).toMatchObject({ bot: 'passenger', chatId: 10, route: '1726>1730' });
    expect(news?.head.join('\n')).toContain('Toshkent → Urgut');
    expect(plain(news?.line?.text ?? '')).toBe('Jasur · ertaga 07:30 · 2 joy · <b>90 000 soʻm</b>');
    expect(plain(cheaper?.line?.text ?? '')).toContain('<b>85 000 soʻm</b> ↓ arzonlashdi');
    expect(buttons(news)).toContain('?find=1726269_1730_2026-10-02');
    expect(buttons(news)).toContain('"callback_data":"news_off:s1"');
  });

  it('a driver: the request with its places, the whole car with its whole price', async () => {
    const { tell, shown } = teller();
    const driver = { ...subscription, kind: 'requests' as const };
    await tell.one(driver, { ...match, name: 'Aziz', seats: 4, wholeCar: true });
    expect(shown[0]).toMatchObject({ bot: 'driver', chatId: 10 });
    expect(plain(shown[0]?.line?.text ?? '')).toBe(
      '🚐 Aziz · butun salon · ertaga · Chilonzor → Urgut · <b>360 000 soʻm</b>',
    );
    expect(buttons(shown[0])).toContain('?requests=1726269_1730_2026-10-02');
  });

  it('«any date» is over: the card asks to renew it and opens «Obunalar»', async () => {
    const { tell, shown } = teller();
    await tell.renew(subscription);
    expect(shown[0]?.head[0]).toContain('muddati tugadi');
    expect(shown[0]?.line).toBeUndefined();
    expect(buttons(shown[0])).toContain('?subscriptions=1');
  });
});
