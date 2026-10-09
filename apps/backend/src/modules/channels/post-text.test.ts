import { describe, expect, it } from 'vitest';
import { PLACES, TRIP } from './channels-fixtures';
import { channelPost } from './infrastructure/post-text';
import { hashtagOf } from './infrastructure/post-parts';

// 1.10.2026 05:00 in Tashkent: the trip (2.10 08:30) is tomorrow.
const BEFORE = Date.parse('2026-10-01T00:00:00Z');
const render = channelPost('test_bot');
// A post of the Samarqand channel: its links carry the channel's mark (G55, docs/116).
type Args = Parameters<typeof render>;
const post = (trip: Args[0], now: number) => render(trip, PLACES, now, 'yol_samarqand');
const lines = (text: string) => text.split('\n').map((line) => line.replace(/\s/gu, ' '));
const BOOK = 'https://t.me/test_bot?startapp=trip_trip-1__ch-yol-samarqand';
const SHARE =
  'https://t.me/share/url?url=' +
  encodeURIComponent(BOOK) +
  '&text=' +
  encodeURIComponent('Toshkent shahri → Samarqand viloyati, 2-oktabr, juma: boʻsh joy bor.');
const FIND = 'https://t.me/test_bot?startapp=find_1726269_1718401__ch-yol-samarqand';

// The post of a trip as in the bot (G68, docs/122, mockup g68/5): no address, plate, name.
describe('the channel post of a trip (G68, mockup g68/5)', () => {
  it('a new trip: the day and the time, both ends in quotes, the seats, the car', () => {
    const { text, markup } = post(TRIP, BEFORE);
    expect(lines(text)).toEqual([
      '<b>🆕 Yangi safar</b>',
      '<b>Ertaga, 2-oktabr · 08:30 → ≈ 13:30</b>',
      '<blockquote>🟢 <b>Chilonzor</b>, Toshkent shahri',
      '🚏 Toshkent avtovokzalidan yoki 🏠 uyingizdan</blockquote>',
      '<blockquote>🔴 <b>Samarqand shahri</b>, Samarqand viloyati',
      '🏠 Uyingizgacha</blockquote>',
      '💺 🟩🟩🟩⬜ 3 ta boʻsh joy · 💰 <b>85 000</b>',
      '🚘 Cobalt, oq · ✅ Tekshirilgan · 🆕 Yangi haydovchi',
      '👩 Mashinada ayol bor',
      '#SamarqandShahri #Chilonzor',
    ]);
    expect(text).not.toMatch(/Jasur|01A|\+998/u);
    expect(markup).toEqual({
      inline_keyboard: [
        [
          { text: 'Joy band qilish', url: BOOK },
          { text: '📤 Doʻstga', url: SHARE },
        ],
      ],
    });
  });

  it('the last seat says so on top; the rating of a rated driver', () => {
    const rated = { ...TRIP, seatsLeft: 1, driver: { ...TRIP.driver, rating: { average: 4.9, count: 12 } } };
    const text = lines(post(rated, BEFORE).text);
    expect(text[0]).toBe('<b>🔥 1 ta joy qoldi</b>');
    expect(text).toContain('💺 🟩⬜⬜⬜ 1 ta boʻsh joy · 💰 <b>85 000</b>');
    expect(text).toContain('🚘 Cobalt, oq · ✅ Tekshirilgan · ⭐ 4,9');
  });

  it('no seats: a short post and «Shunga oʻxshash safarlar»', () => {
    const { text, markup } = post({ ...TRIP, seatsLeft: 0, status: 'full' }, BEFORE);
    expect(lines(text)).toEqual([
      '<b>⛔ Joy qolmadi</b>',
      '<b>Ertaga, 2-oktabr · 08:30</b>',
      'Chilonzor → Samarqand shahri · 5 kishi ketmoqda',
    ]);
    expect(markup).toEqual({ inline_keyboard: [[{ text: '🔎 Shunga oʻxshash safarlar', url: FIND }]] });
  });

  it('on the road and arrived: how many people share the way; no buttons on the road', () => {
    const road = post({ ...TRIP, departedAt: TRIP.departAt }, TRIP.departAt);
    expect(lines(road.text)).toEqual([
      '<b>🚗 Yoʻlga chiqdi</b>',
      '<b>Bugun · 08:30 → ≈ 13:30</b>',
      'Chilonzor → Samarqand shahri · 2 kishi bir mashinada',
    ]);
    expect(road.markup).toEqual({ inline_keyboard: [] });
    const arrivedAt = Date.parse('2026-10-02T08:05:00Z');
    const arrived = post({ ...TRIP, status: 'completed', arrivedAt }, arrivedAt);
    expect(lines(arrived.text)).toEqual([
      '<b>🏁 Yetib bordi</b>',
      'Chilonzor → Samarqand shahri · 2 kishi · 13:05 da',
      'Yoʻl xarajati 2 ga boʻlindi',
    ]);
    expect(arrived.markup).toEqual({ inline_keyboard: [[{ text: '🔎 Keyingi safarni topish', url: FIND }]] });
  });

  it('a driver alone: the route without people and without the split', () => {
    const alone = { ...TRIP, seatsLeft: 4, status: 'completed' as const, arrivedAt: TRIP.departAt };
    expect(lines(post(alone, TRIP.departAt).text)).toEqual([
      '<b>🏁 Yetib bordi</b>',
      'Chilonzor → Samarqand shahri · 08:30 da',
    ]);
  });

  it('a cancelled trip: the post goes away; an old one Telegram keeps says it', () => {
    const cancelled = post({ ...TRIP, status: 'cancelled' }, BEFORE);
    expect(cancelled.remove).toBe(true);
    expect(lines(cancelled.text)[0]).toBe('<b>❌ Safar bekor qilindi</b>');
  });

  it('escapes names for HTML; a hashtag keeps only Latin letters and digits', () => {
    const places = new Map([...PLACES, ['1718402', { name: 'A<b>&', parentId: '1718' }]]);
    const { text } = render({ ...TRIP, from: '1718401', to: '1718402' }, places, BEFORE, 'yol_samarqand');
    expect(text).toContain('🔴 <b>A&lt;b&gt;&amp;</b>');
    expect(hashtagOf('Kattaqoʻrgʻon')).toBe('#Kattaqorgon');
    expect(hashtagOf('Samarqand shahri')).toBe('#SamarqandShahri');
    expect(hashtagOf('<>')).toBe('');
  });
});
