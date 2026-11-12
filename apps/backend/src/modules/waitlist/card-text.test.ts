import { loadBrand } from '@platform/brands';
import { toCyrillic } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import type { CardView } from './application/person';
import { openedRing, waitlistCard } from './infrastructure/card-text';
import { inviteText } from './infrastructure/invite-text';

const brand = loadBrand();
const places = new Map([
  ['1726', { name: 'Toshkent shahri', parentId: null }],
  ['1718', { name: 'Samarqand viloyati', parentId: null }],
]);
const record = {
  userId: 7,
  role: 'passenger' as const,
  pains: ['chats', 'phone'] as const,
  home: '1718',
  region: '1718',
  cadence: 'weekly' as const,
  via: null,
  createdAt: 0,
  notifiedAt: null,
};
const view = (overrides: Partial<CardView> = {}): CardView => ({
  record: { ...record, pains: [...record.pains] },
  waiting: { passengers: 124, drivers: 12, share: 64 },
  opened: false,
  code: 'abcdefgh',
  ...overrides,
});
const buttons = (markup: unknown) => JSON.stringify(markup);

describe('the live card of the main bot (G83, docs/182)', () => {
  it('shows the record: status, when, the route, who waits, the chosen pains; pinned', () => {
    const card = waitlistCard(brand, view(), places, 0, null);
    expect(card.text).toContain(toCyrillic('⏳ Roʻyxatdasiz'));
    expect(card.text).toContain(toCyrillic('<b>Har hafta · tez orada ochiladi</b>'));
    expect(card.text).toContain(toCyrillic('🛣 Toshkent shahri ↔ Samarqand viloyati'));
    expect(card.text).toContain(toCyrillic('👥 124 kishi kutmoqda · 🚗 12 haydovchi'));
    expect(card.text).toContain(toCyrillic('Siz tanlagan: 🔎 Telegram'));
    expect(card.text).toContain(toCyrillic('tartibsizlik, 🔒 shaxsiy raqam xavfsizligi'));
    expect(card.footer).toContain(toCyrillic('har dushanba yangilanadi'));
    expect(card).toMatchObject({ bot: 'main', chatId: 7, key: 'waitlist:passenger', pin: true });
    expect(buttons(card.markup)).toContain(encodeURIComponent(`start=fr-abcdefgh`));
    expect(buttons(card.markup)).toContain('open=edit');
  });

  it('a driver: «haydovchi», the passengers who wait and «Haydovchi boʻlish» first', () => {
    const card = waitlistCard(
      brand,
      view({ record: { ...record, pains: ['empty'], role: 'driver' } }),
      places,
      0,
      null,
    );
    expect(card.text).toContain(toCyrillic('⏳ Roʻyxatdasiz · haydovchi'));
    expect(card.text).toContain(toCyrillic('👥 124 yoʻlovchi kutmoqda'));
    expect(buttons(card.markup)).toContain(`t.me/${brand.bots.driver}?startapp=__waitlist`);
  });

  it('turns green once the direction opened, with the trips of today and the ring', () => {
    const card = waitlistCard(brand, view({ opened: true }), places, 0, { today: 5, tomorrow: 7 });
    expect(card.text).toContain(toCyrillic('✅ Yoʻnalish ochildi'));
    expect(card.text).toContain(toCyrillic('<b>Bugun 5 ta safar · ertaga 7 ta</b>'));
    expect(buttons(card.markup)).toContain(`find_1718_1726__waitlist`);
    const ring = openedRing(view({ opened: true }), places);
    expect(ring.text).toContain(toCyrillic('endi guruhlardan qidirmaysiz'));
    expect(ring).toMatchObject({ card: 'waitlist:passenger', quiet: false });
    const driver = openedRing(
      view({ opened: true, record: { ...record, pains: ['empty'], role: 'driver' } }),
      places,
    );
    expect(driver.text).toContain(toCyrillic('124 yoʻlovchi safaringizni kutmoqda. Endi qaytish safarini'));
  });

  it('the message to a friend speaks of the first pain and the route', () => {
    const text = inviteText(brand, { role: 'passenger', pains: ['wait'], region: '1718' }, places);
    expect(text).toMatch(/^Мен ҳам питакда соатлаб кутишдан чарчадим\./u);
    expect(text).toContain(toCyrillic('Men yozildim: Toshkent shahri ↔ Samarqand viloyati.'));
  });
});
