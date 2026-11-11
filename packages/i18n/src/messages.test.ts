import { describe, expect, it } from 'vitest';
import kept from '../locales/uz-Cyrl/keep.json' with { type: 'json' };
import { CATALOG, lookup, messageOf, type TranslationKey } from './messages';

const MODIFIER_LETTER_TURNED_COMMA = 'ʻ';
const WRONG_APOSTROPHES = /[oOgG]['`‘’ʼ]/;
// A number never parts from its unit or from «≈» on a narrow phone: a non breaking space joins them.
const BREAKABLE_UNIT = /\} (km|soʻm)\b|≈ \{/u;
// The one line the mockup breaks before «soʻm» (g63/4 screen 4): «Всё как на макете» (07.10.2026).
const BREAKS_AS_ON_MOCKUP = new Set(['market.rule.price']);
// What a Cyrillic message may still hold in Latin: {place}, the keys of plural and select, links,
// @names, /commands, plates and the words of keep.json (G98, docs/228).
const NOT_WORDS =
  /\{\s*\w+\s*(?:,\s*\w+\s*)?|\b(?:other|one|few|many|zero|two)\s*\{|https?:\/\/\S+|t\.me\/\S+|@\w+|\/[a-z_]+|\S+\.uz\b|\b\d{2} [A-Z] \d{3} [A-Z]{2}\b|\b\d{2} \d{3} [A-Z]{3}\b|\b[a-z]\s*\{/gu;
const KEPT = new RegExp(String.raw`\b(?:${kept.join('|')})[a-zʻʼ]*`, 'gu');

const KEYS = Object.entries(CATALOG).flatMap(([namespace, messages]) =>
  Object.keys(messages).map((key) => `${namespace}.${key}` as TranslationKey),
);

describe('messages', () => {
  it('fails loudly on a missing key', () => {
    expect(() => lookup(CATALOG, 'common.nope' as TranslationKey)).toThrow('i18n.missing_key');
  });

  it('writes oʻ and gʻ with U+02BB only in the reference (docs/25)', () => {
    const messages = KEYS.map((key) => messageOf('uz-Latn', key));
    expect(messages.join(' ')).toContain(MODIFIER_LETTER_TURNED_COMMA);
    expect(messages.filter((message) => WRONG_APOSTROPHES.test(message))).toEqual([]);
  });

  it('keeps a number with its unit on one line (G27)', () => {
    const breakable = KEYS.filter(
      (key) => BREAKABLE_UNIT.test(messageOf('uz-Latn', key)) && !BREAKS_AS_ON_MOCKUP.has(key),
    );
    expect(breakable).toEqual([]);
  });

  it('shows every message in Cyrillic: Latin only in what stays as written (G98)', () => {
    const latin = KEYS.filter((key) =>
      /[A-Za-zʻ]/u.test(messageOf('uz-Cyrl', key).replace(NOT_WORDS, '').replace(KEPT, '')),
    );
    expect(latin).toEqual([]);
  });

  it('formats a Cyrillic message with the same values as the reference', () => {
    expect(messageOf('uz-Cyrl', 'common.money')).toBe('{amount} сўм');
    expect(messageOf('uz-Cyrl', 'bot.navbat.counts')).toBe(
      '{applications} ариза · {complaints} шикоят · {faces} расм{supports, plural, =0 {} other { · # мурожаат}}',
    );
  });
});
