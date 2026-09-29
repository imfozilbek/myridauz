import { describe, expect, it } from 'vitest';
import { brandForApp, loadBrand, UnknownBrandError } from './index';

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

describe('brandForApp (docs/20)', () => {
  const brand = loadBrand();
  it('gives each Mini App its own main color and keeps the rest', () => {
    const passenger = brandForApp(brand, 'passenger').theme.colors;
    const driver = brandForApp(brand, 'driver').theme.colors;
    const admin = brandForApp(brand, 'admin').theme.colors;
    expect(passenger).toEqual(brand.theme.colors);
    expect(new Set([passenger.brandStrong, driver.brandStrong, admin.brandStrong]).size).toBe(3);
    expect(driver.text).toBe(passenger.text);
    expect(admin.danger).toBe(passenger.danger);
  });
});
