import { describe, expect, it } from 'vitest';
import { t } from './translate';

describe('t', () => {
  it('returns the text for a key', () => {
    expect(t('start.passenger')).toBe('Safar toping');
  });

  it('puts parameters into the text', () => {
    expect(t('start.admin', { brand: 'Brend' })).toBe('Brend jamoasi uchun');
  });

  it('keeps a placeholder without a parameter', () => {
    expect(t('start.admin')).toBe('{brand} jamoasi uchun');
  });
});
