import { describe, expect, it } from 'vitest';
import places from '../../../seed/locations.json' with { type: 'json' };
import { PLACES, TRIP } from './channels-fixtures';
import { channelPost, tagOf } from './infrastructure/post-text';

const REGIONS = (places as readonly { id: string; parentId: string | null }[])
  .filter((place) => place.parentId === null)
  .map((place) => place.id);

describe('the channel post (docs/15)', () => {
  it('writes the post without contacts, with "Joy band qilish" and the route subscription', () => {
    const { text, markup } = channelPost('test_bot')({ ...TRIP, hasMeetingPoint: true }, PLACES);
    expect(text.split('\n').map((line) => line.replace(/\s/gu, ' '))).toEqual([
      '<b>Toshkent shahri → Samarqand viloyati</b>',
      '📍 Chilonzor → Samarqand shahri',
      '',
      '📅 <b>2-oktabr, juma</b>',
      '🕗 Joʻnash: <b>08:30</b>, yetib borish: ≈ 13:30',
      '💺 <b>3</b> ta boʻsh joy',
      '💰 Bir joy: <b>85 000 soʻm</b>',
      '🚘 Chevrolet Cobalt, oq',
      '👩 Mashinada ayol bor',
      '📌 Uchrashuv joyi belgilangan',
      '',
      '#Toshkent #Samarqand',
    ]);
    expect(text).not.toMatch(/Jasur|01A|\+998/u);
    const subscribe = {
      text: '🔔 Shu yoʻnalishga obuna',
      url: 'https://t.me/test_bot?startapp=sub_1726_1718_2026-10-02',
    };
    expect(markup).toEqual({
      inline_keyboard: [
        [{ text: 'Joy band qilish', url: 'https://t.me/test_bot?startapp=trip_trip-1' }],
        [subscribe],
      ],
    });
    const full = channelPost('test_bot')({ ...TRIP, seatsLeft: 0, status: 'full' }, PLACES);
    expect(full.text.split('\n')).toEqual([
      '<b>⛔ Joy qolmagan</b>',
      '<b>Toshkent shahri → Samarqand viloyati</b>',
      '📍 Chilonzor → Samarqand shahri',
      '📅 2-oktabr, juma, 08:30',
    ]);
    expect(full.markup).toEqual({ inline_keyboard: [[subscribe]] });
    const cancelled = channelPost('test_bot')({ ...TRIP, status: 'cancelled' }, PLACES);
    expect(cancelled.text.startsWith('<b>❌ Safar bekor qilindi</b>')).toBe(true);
  });

  it('escapes names for HTML and tags a region once', () => {
    const places = new Map([...PLACES, ['1718402', { name: 'A<b>&', parentId: '1718' }]]);
    const { text } = channelPost('test_bot')({ ...TRIP, from: '1718401', to: '1718402' }, places);
    expect(text).toContain('📍 Samarqand shahri → A&lt;b&gt;&amp;');
    expect(text.endsWith('\n#Samarqand')).toBe(true);
  });

  it('has a hashtag for each of the 14 regions', () => {
    for (const region of REGIONS) expect(tagOf(region)).toMatch(/^#[A-Za-z]+$/u);
  });
});
