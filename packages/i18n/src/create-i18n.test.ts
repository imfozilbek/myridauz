import { describe, expect, it } from 'vitest';
import { createI18n } from './create-i18n';
import { DEFAULT_LOCALE } from './config';

const i18n = createI18n(DEFAULT_LOCALE);
const NBSP = '\u00A0';
const TASHKENT_AFTERNOON = new Date('2026-09-27T09:30:00Z');

describe('createI18n', () => {
  it('translates keys from namespaces', () => {
    expect(i18n.t('common.continue')).toBe('Davom etish');
    expect(i18n.t('errors.generic.title')).toBe('Xatolik yuz berdi');
    expect(i18n.t('account.team.denied', { brand: 'Brend' })).toBe('Bu boʻlim faqat Brend jamoasi uchun.');
  });

  it('formats money with a space between thousands', () => {
    expect(i18n.formatMoney(150000)).toBe(`150${NBSP}000 soʻm`);
  });

  it('formats date and time in Uzbekistan time', () => {
    expect(i18n.formatDate(TASHKENT_AFTERNOON)).toBe('27-sentabr');
    expect(i18n.formatTime(TASHKENT_AFTERNOON)).toBe('14:30');
    expect(i18n.formatWeekday(TASHKENT_AFTERNOON)).toBe('yakshanba');
  });

  it('takes the Tashkent day, not the UTC day', () => {
    const tashkentEarlyMorning = new Date('2026-12-31T20:30:00Z');
    expect(i18n.formatDate(tashkentEarlyMorning)).toBe('1-yanvar');
    expect(i18n.formatWeekday(tashkentEarlyMorning)).toBe('juma');
  });
});
