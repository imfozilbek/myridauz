import { describe, expect, it } from 'vitest';
import { createI18n } from './create-i18n';
import { DEFAULT_LOCALE } from './config';

const i18n = createI18n(DEFAULT_LOCALE);
const NBSP = '\u00A0';
const TASHKENT_AFTERNOON = new Date('2026-09-27T09:30:00Z');

describe('createI18n', () => {
  it('translates keys from namespaces', () => {
    expect(i18n.t('common.continue')).toBe('Давом этиш');
    expect(i18n.t('errors.generic.title')).toBe('Хатолик юз берди');
    expect(i18n.t('account.team.denied', { brand: 'Brend' })).toBe('Бу бўлим фақат Brend жамоаси учун.');
  });

  it('formats money with a space between thousands', () => {
    expect(i18n.formatMoney(150000)).toBe(`150${NBSP}000${NBSP}сўм`);
  });

  it('formats a rating always with one decimal, like «★ 5,0» (mockup g60/6)', () => {
    expect(i18n.formatRating(5)).toBe('5,0');
    expect(i18n.formatRating(4.86)).toBe('4,9');
  });

  it('formats date and time in Uzbekistan time', () => {
    expect(i18n.formatDate(TASHKENT_AFTERNOON)).toBe('27-сентябр');
    expect(i18n.formatTime(TASHKENT_AFTERNOON)).toBe('14:30');
    expect(i18n.formatWeekday(TASHKENT_AFTERNOON)).toBe('якшанба');
  });

  it('takes the Tashkent day, not the UTC day', () => {
    const tashkentEarlyMorning = new Date('2026-12-31T20:30:00Z');
    expect(i18n.formatDate(tashkentEarlyMorning)).toBe('1-январ');
    expect(i18n.formatWeekday(tashkentEarlyMorning)).toBe('жума');
  });

  it('keeps one word in one alphabet: a Latin name keeps its ending in Latin (G98)', () => {
    expect(i18n.t('chat.newTripsOf', { name: 'Jasur' })).toBe('Jasurning янги сафарлари');
    expect(i18n.t('chat.newTripsOf', { name: 'Жасур' })).toBe('Жасурнинг янги сафарлари');
  });

  it('shows a place kept in Latin in the alphabet of the text (G98)', () => {
    expect(i18n.placeName('Chorsu bozori')).toBe('Чорсу бозори');
    expect(i18n.placeName('Чорсу бозори')).toBe('Чорсу бозори');
    expect(i18n.t('way.near', { name: i18n.placeName('Chorsu') })).toContain('Чорсу');
  });

  it('keeps a link whole when a value ends it (G98)', () => {
    expect(i18n.t('bot.driver.channel', { username: 'kanal1uz' })).toContain('t.me/kanal1uz');
  });

  it('reads the values a message asks for from any object (G98)', () => {
    const anyValue = new Proxy({}, { has: () => true, get: () => 'Qarshi' });
    expect(i18n.t('chat.newTripsOf', anyValue)).toBe('Qarshining янги сафарлари');
    expect(i18n.t('sheet.meet.waitsIn', anyValue)).toContain('Қарши');
  });
});
