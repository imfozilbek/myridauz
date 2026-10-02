import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from './config';
import { createI18n } from './create-i18n';
import { legalEdition, legalSections, legalTitle, legalValues } from './legal';

const i18n = createI18n(DEFAULT_LOCALE);
const brand = {
  name: 'Yoʻl',
  bots: { support: 'yol_yordam_bot' },
  company: { legalName: 'Yoʻl', form: 'MChJ', stir: '123456789', address: 'Toshkent' },
  commission: { percent: 7, minPerSeat: 2000 },
  promo: { amount: 100_000, grants: 2, days: 10, windowDays: 60 },
};

describe('legal texts (docs/30)', () => {
  it('follows the numbered sections of each document in order', () => {
    expect(legalSections('offer')).toHaveLength(12);
    expect(legalSections('privacy')).toHaveLength(8);
    expect(legalSections('consent')[0]).toEqual({
      title: 'legal.consent.1.title',
      text: 'legal.consent.1.text',
    });
    expect(i18n.t(legalTitle('privacy'))).toBe('Maxfiylik siyosati');
  });

  it('takes every number and name from the brand, not from the text', () => {
    const values = legalValues(i18n, brand);
    expect(values).toMatchObject({ brand: 'Yoʻl', supportBot: 'yol_yordam_bot', percent: '7', grants: '2' });
    expect(values.minPerSeat).toMatch(/^2\s000\ssoʻm$/u);
    expect(values.company).toContain('STIR 123456789');
    const text = i18n.t('legal.offer.7.text', values);
    expect(text).toContain('7 foizi');
    expect(text).not.toMatch(/\{\w+\}/u);
  });

  it('writes the edition with its date', () => {
    expect(legalEdition(i18n, { version: '1.0', date: '2026-09-30' })).toBe('Tahrir 1.0, 30-sentabr 2026');
  });
});
