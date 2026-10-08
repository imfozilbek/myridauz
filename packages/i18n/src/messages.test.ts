import { describe, expect, it } from 'vitest';
import { ENABLED_LOCALES } from './config';
import { CATALOGS, lookup, type TranslationKey } from './messages';

const MODIFIER_LETTER_TURNED_COMMA = '\u02BB';
const WRONG_APOSTROPHES = /[oOgG]['`\u2018\u2019\u02BC]/;
// A number never parts from its unit or from «≈» on a narrow phone: a non breaking space joins them.
const BREAKABLE_UNIT = /\} (km|soʻm)\b|≈ \{/u;
// The one line the mockup breaks before «soʻm» (g63/4 screen 4): «Всё как на макете» (07.10.2026).
const BREAKS_AS_ON_MOCKUP = new Set(['market.rule.price']);

const allMessages = (locale: (typeof ENABLED_LOCALES)[number]) =>
  Object.values(CATALOGS[locale]).flatMap((namespace) => Object.values(namespace));

describe('messages', () => {
  it('fails loudly on a missing key', () => {
    expect(() => lookup(CATALOGS['uz-Latn'], 'common.nope' as TranslationKey)).toThrow('i18n.missing_key');
  });

  it.each(ENABLED_LOCALES)('%s writes oʻ and gʻ with U+02BB only (docs/25)', (locale) => {
    const messages = allMessages(locale);
    expect(messages.join(' ')).toContain(MODIFIER_LETTER_TURNED_COMMA);
    expect(messages.filter((message) => WRONG_APOSTROPHES.test(message))).toEqual([]);
  });

  it.each(ENABLED_LOCALES)('%s keeps a number with its unit on one line (G27)', (locale) => {
    const breakable = Object.entries(CATALOGS[locale]).flatMap(([namespace, messages]) =>
      Object.entries(messages)
        .filter(
          ([key, message]) => BREAKABLE_UNIT.test(message) && !BREAKS_AS_ON_MOCKUP.has(`${namespace}.${key}`),
        )
        .map(([key]) => `${namespace}.${key}`),
    );
    expect(breakable).toEqual([]);
  });
});
