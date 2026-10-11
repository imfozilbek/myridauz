import type { BrandConfig } from '@platform/brands';

// The support bot of the brand (docs/50): one link for every button of the bots that leads there
// (G79, a finding of G77).
export const supportUrl = (brand: BrandConfig) => `https://t.me/${brand.bots.support}`;
