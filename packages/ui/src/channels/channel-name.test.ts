import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { channelName, shownName } from './channel-name';

const brand = loadBrand();
const [boka] = brand.channels;
// A separator ends a line, it never opens one (docs/121).
const KEPT = '\u00a0| ';

describe('the name of a channel in the apps (owner 13.10.2026, docs/176)', () => {
  it('is the name in Telegram without the brand in front', () => {
    expect(shownName(brand, `${brand.name} | Boʻka | Bekobod`)).toBe(`Boʻka${KEPT}Bekobod`);
  });

  it('keeps a name that does not open with the brand', () => {
    expect(shownName(brand, `${brand.name}chi | Boʻka`)).toBe(`${brand.name}chi${KEPT}Boʻka`);
    expect(shownName(brand, 'Fargʻona yoʻli')).toBe('Fargʻona yoʻli');
  });

  it('takes a channel of the brand by its name in Telegram, a channel of the team by its title', () => {
    expect(channelName(brand, { chat: boka?.chat ?? '', title: 'whatever' })).toBe(`Boʻka${KEPT}Bekobod`);
    expect(channelName(brand, { chat: '@yol_fargona', title: 'Fargʻona yoʻli' })).toBe('Fargʻona yoʻli');
  });
});
