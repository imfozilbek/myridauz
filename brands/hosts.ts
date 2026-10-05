import type { BrandConfig } from './brand-config';

// Addresses of a brand (docs/22): the API and one Mini App per role on subdomains of the brand domain.
export const apiHost = (brand: BrandConfig) => `api.${brand.domain}`;
// The map of the Mini Apps: public R2, not the Worker (G57, docs/67).
export const mapHost = (brand: BrandConfig) => `map.${brand.domain}`;
export const appHost = (brand: BrandConfig, app: string) => `${app}.${brand.domain}`;
