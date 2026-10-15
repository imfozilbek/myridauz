import { loadBrand, type BrandConfig } from '@platform/brands';
import { withLimits, type OwnerLimits } from '@platform/contracts';

// The limits the owner set (G75, docs/128 §4), as the limits module last read them in this isolate.
let values: OwnerLimits['values'] = {};
export const keepLimits = (next: OwnerLimits['values']) => void (values = next);
// The values for the Mini Apps (GET /public/limits).
export const ownerLimits = (): OwnerLimits['values'] => values;

type BrandEnv = { readonly BRAND?: string; readonly ENVIRONMENT?: string };

// The bare config of the Worker: its brand in its environment (docs/22, docs/179).
export const configOf = (env: BrandEnv): BrandConfig => loadBrand(env.BRAND, env.ENVIRONMENT);

// The brand on the server: its config with the limits of the owner. Every rule of people reads this
// instead of the bare config (docs/22, docs/128 §4).
export const brandOf = (env: BrandEnv): BrandConfig => withLimits(configOf(env), values);

// The site of the environment the pictures of the bots and channels come from (G34, docs/180): the
// stand points SITE_URL at its stub, so nothing leaves the computer.
export const siteOf = (env: BrandEnv & { readonly SITE_URL?: string }): string =>
  env.SITE_URL ?? `https://${configOf(env).domain}`;
