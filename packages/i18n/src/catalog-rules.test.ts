import { describe, expect, it } from 'vitest';
import { createI18n } from './create-i18n';
import { DEFAULT_LOCALE } from './config';
import { placeEnd } from './place-end';
import { toCyrillic } from './cyrillic';
import { CATALOG } from './messages';

const PLACE = 'from|to|place|route|region|area|pitak|city|zone|pickup|drop|direction';
const BARE_ENDING = new RegExp(String.raw`\{(?:${PLACE})\}(?:ga|gacha)\b`, 'u');

function messages(value: unknown, key = ''): [string, string][] {
  if (typeof value === 'string') return [[key, value]];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([name, inner]) => messages(inner, key ? `${key}.${name}` : name));
}

const catalog = messages(CATALOG);

const { t } = createI18n(DEFAULT_LOCALE);
const toward = (name: string) => toCyrillic(name);

// Prism of the texts 17.11.2026: «Muborakga», «Chortoqga» on the screen of the family and the sheet
// of a message; a place ending in «k» or «q» takes «ka», «qa» (docs/25).
describe('the ending after the name of a place', () => {
  it('every «-ga» after a place picks «ka», «qa» by its last letter', () => {
    expect(catalog.filter(([, text]) => BARE_ENDING.test(text)).map(([key]) => key)).toEqual([]);
  });

  it('«Muborakka», «Chortoqqa», «Samarqandga» in each of these texts', () => {
    for (const [name, ending] of [
      ['Muborak', 'Muborakka'],
      ['Chortoq', 'Chortoqqa'],
      ['Samarqand', 'Samarqandga'],
    ] as const) {
      const end = placeEnd(name);
      expect(t('share.follow.eta', { place: name, end, time: '14:00' })).toContain(toward(ending));
      expect(t('sheet.message.trip', { when: 'Ertaga', to: name, end })).toContain(toward(ending));
      expect(t('bot.board.to', { region: name, end })).toContain(toward(ending));
      expect(t('landing.directions.to', { city: name, end })).toBe(toward(ending));
    }
  });
});

// The words of the product the owner chose on 17.11.2026 (docs/25): one notion, one word.
describe('the words of the glossary', () => {
  const RIVALS: readonly [RegExp, string][] = [
    [/\bbron/iu, 'band qilish'],
    [/\bfikr/iu, 'sharh'],
    [/\bkutmoqda\b/iu, 'kutyapti'],
    [/\{brand\} (?:da|ga|dan|ni|ning|gacha)\b/u, '{brand}da'],
  ];

  it('no rival word of «band qilish», «sharh», «kutyapti», «{brand}da»', () => {
    const found = RIVALS.flatMap(([rival, word]) =>
      catalog.filter(([, text]) => rival.test(text)).map(([key]) => `${key}: ${word}`),
    );
    expect(found).toEqual([]);
  });
});
