import { describe, expect, it } from 'vitest';
import { formatMessage } from './format-message';

const SEATS = '{count, plural, =0 {Joy yoʻq} one {# ta joy} other {# ta joy qoldi}}';

describe('formatMessage', () => {
  it('chooses the plural form', () => {
    expect(formatMessage(SEATS, 'uz-Latn', { count: 0 })).toBe('Joy yoʻq');
    expect(formatMessage(SEATS, 'uz-Latn', { count: 1 })).toBe('1 ta joy');
    expect(formatMessage(SEATS, 'uz-Latn', { count: 3 })).toBe('3 ta joy qoldi');
  });

  it('puts values into placeholders and reuses the parsed pattern', () => {
    expect(formatMessage('{brand} jamoasi', 'uz-Latn', { brand: 'Brend' })).toBe('Brend jamoasi');
    expect(formatMessage('{brand} jamoasi', 'uz-Latn', { brand: 'Boshqa' })).toBe('Boshqa jamoasi');
  });
});
