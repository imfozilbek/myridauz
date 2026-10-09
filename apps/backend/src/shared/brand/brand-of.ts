import { loadBrand, type BrandConfig } from '@platform/brands';
import type { LimitKey } from '@platform/contracts';
import { withLimits } from './limits';

// The limits the owner set (G75, docs/128 §4), as the limits module last read them in this isolate.
let values: ReadonlyMap<LimitKey, number> = new Map();
export const keepLimits = (next: ReadonlyMap<LimitKey, number>) => void (values = next);

// The brand on the server: its config with the limits of the owner. Every rule of people reads this
// instead of the bare config (docs/22, docs/128 §4).
export const brandOf = (env: { readonly BRAND?: string }): BrandConfig =>
  withLimits(loadBrand(env.BRAND), values);
