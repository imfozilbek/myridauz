import type { BrandConfig } from './brand-config';

// Addresses of a brand (docs/22): the API and one Mini App per role on subdomains of the brand domain.
export const apiHost = (brand: BrandConfig) => `api.${brand.domain}`;
export const appHost = (brand: BrandConfig, app: string) => `${app}.${brand.domain}`;
