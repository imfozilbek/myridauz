import { describe, expect, it } from 'vitest';
import { companyEdition, companySchema } from './company';
import { LEGAL_EDITION } from './legal';

const company = {
  legalName: 'Yoʻldosh',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent shahri, Mirobod tumani',
  email: 'info@example.uz',
};
// 12:00 in Tashkent on these days.
const at = (date: string) => Date.parse(`${date}T07:00:00Z`);

describe('company requisites (docs/30, G34)', () => {
  it('accepts the five fields and a STIR of exactly 9 digits', () => {
    expect(companySchema.parse({ ...company, legalName: '  Yoʻldosh  ' }).legalName).toBe('Yoʻldosh');
    for (const stir of ['12345678', '1234567890', '12345678a', ''])
      expect(companySchema.safeParse({ ...company, stir }).success).toBe(false);
    expect(companySchema.safeParse({ ...company, email: 'no-at' }).success).toBe(false);
    expect(companySchema.safeParse({ ...company, address: 'Uy' }).success).toBe(false);
  });

  it('keeps the base edition until the first save, then each save is the next edition', () => {
    expect(companyEdition(null, 0)).toEqual(LEGAL_EDITION);
    expect(companyEdition(1, at('2026-10-06'))).toEqual({ version: '1.3', date: '2026-10-06' });
    expect(companyEdition(2, at('2026-11-01'))).toEqual({ version: '1.4', date: '2026-11-01' });
  });

  it('takes the date of the save in Tashkent, never earlier than the base edition', () => {
    expect(companyEdition(1, Date.parse('2026-10-05T20:00:00Z')).date).toBe('2026-10-06');
    expect(companyEdition(1, 0).date).toBe(LEGAL_EDITION.date);
  });
});
