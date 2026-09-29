import type { AppName, BrandConfig } from './brand-config';
import { brandConfig as rida } from './rida/brand.config.ts';

export type { BrandColors, BrandConfig, CommissionRule, HexColor, PromoRule } from './brand-config';
export { commissionFor } from './commission.ts';
export { apiHost, appHost } from './hosts.ts';

const BRANDS: Readonly<Record<string, BrandConfig>> = { [rida.id]: rida };
const DEFAULT_BRAND_ID = rida.id;

export class UnknownBrandError extends Error {
  constructor(id: string) {
    super(`brand.unknown:${id}`);
  }
}

// The brand is chosen at build time (docs/22); without a choice the main brand is used.
export function loadBrand(id: string = DEFAULT_BRAND_ID): BrandConfig {
  const brand = BRANDS[id];
  if (!brand) throw new UnknownBrandError(id);
  return brand;
}

// The brand as one Mini App sees it: its own main color over the common colors (docs/20).
export function brandForApp(brand: BrandConfig, app: AppName): BrandConfig {
  const colors = { ...brand.theme.colors, ...brand.theme.apps[app] };
  return { ...brand, theme: { ...brand.theme, colors } };
}
