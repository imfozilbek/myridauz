import { loadBrand, type BrandConfig } from '@platform/brands';
import { withLimits, type OwnerLimits } from '@platform/contracts';

// The limits the owner set (G75, docs/128 §4), as the limits module last read them in this isolate.
let values: OwnerLimits['values'] = {};
export const keepLimits = (next: OwnerLimits['values']) => void (values = next);
// The values for the Mini Apps (GET /public/limits).
export const ownerLimits = (): OwnerLimits['values'] => values;

// The brand on the server: its config with the limits of the owner. Every rule of people reads this
// instead of the bare config (docs/22, docs/128 §4).
export const brandOf = (env: { readonly BRAND?: string }): BrandConfig =>
  withLimits(loadBrand(env.BRAND), values);
