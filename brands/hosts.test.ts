import { describe, expect, it } from 'vitest';
import { apiHost, appHost, loadBrand } from './index';

describe('hosts', () => {
  it('puts the API and each Mini App on subdomains of the brand domain', () => {
    const brand = loadBrand();
    expect(apiHost(brand)).toBe(`api.${brand.domain}`);
    expect(appHost(brand, 'driver')).toBe(`driver.${brand.domain}`);
  });
});
