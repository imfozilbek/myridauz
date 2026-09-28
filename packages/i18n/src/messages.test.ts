import { describe, expect, it } from 'vitest';
import { ENABLED_LOCALES } from './config';
import { CATALOGS, lookup, type TranslationKey } from './messages';

const MODIFIER_LETTER_TURNED_COMMA = '\u02BB';
const WRONG_APOSTROPHES = /[oOgG]['`\u2018\u2019\u02BC]/;

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
});
