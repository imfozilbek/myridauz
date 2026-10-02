import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from './config';
import { createI18n } from './create-i18n';
import { legalEdition, legalSections, legalTitle, legalValues } from './legal';

const i18n = createI18n(DEFAULT_LOCALE);
const brand = {
  name: 'Yoʻl',
  bots: { support: 'yol_yordam_bot' },
  company: { email: 'brand@example.uz' },
  commission: { percent: 7, minPerSeat: 2000 },
  promo: { amount: 100_000, grants: 2, days: 10, windowDays: 60 },
};
const requisites = {
  legalName: 'Yoʻl Servis',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent',
  email: 'yol@example.uz',
};
const DOCUMENTS = ['offer', 'privacy', 'consent'];
const allTexts = (values: ReturnType<typeof legalValues>) =>
  DOCUMENTS.flatMap((document) =>
    legalSections(document).flatMap((section) => [
      i18n.t(section.title, values),
      i18n.t(section.text, values),
    ]),
  );

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

  it('takes every number and name from the brand and the requisites, not from the text', () => {
    const values = legalValues(i18n, brand, requisites);
    expect(values).toMatchObject({ brand: 'Yoʻl', supportBot: 'yol_yordam_bot', percent: '7', grants: '2' });
    expect(values.minPerSeat).toMatch(/^2\s000\ssoʻm$/u);
    expect(values.company).toBe('Yoʻl Servis (MChJ, STIR 123456789, manzil: Toshkent)');
    const text = i18n.t('legal.offer.7.text', values);
    expect(text).toContain('7 foizi');
    expect(text).not.toMatch(/\{\w+\}/u);
    expect(i18n.t('legal.offer.12.text', values)).toContain('yol@example.uz manziliga');
    expect(i18n.t('legal.privacy.7.text', values)).toContain('yol@example.uz manziliga');
  });

  it('names the brand and its email until the owner enters the requisites, never a placeholder', () => {
    const values = legalValues(i18n, brand, null);
    expect(values.company).toBe('Yoʻl');
    expect(values.email).toBe('brand@example.uz');
    for (const text of allTexts(values)) expect(text).not.toMatch(/\{/u);
    for (const text of allTexts(legalValues(i18n, brand, requisites))) expect(text).not.toMatch(/\{/u);
  });

  it('writes the edition with its date', () => {
    expect(legalEdition(i18n, { version: '1.0', date: '2026-09-30' })).toBe('Tahrir 1.0, 30-sentabr 2026');
  });
});
