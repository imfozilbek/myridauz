import { describe, expect, it } from 'vitest';
import { loadBrand, UnknownBrandError } from './index';

describe('loadBrand', () => {
  it('returns the main brand by default', () => {
    expect(loadBrand()).toMatchObject({
      domain: 'myrida.uz',
      slogan: 'Manzil sari',
      monetization: 'commission',
    });
  });

  it('returns a brand by id', () => {
    expect(loadBrand('rida').name).toBe('Rida');
  });

  it('fails on an unknown brand', () => {
    expect(() => loadBrand('unknown')).toThrow(UnknownBrandError);
  });
});
