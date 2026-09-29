import { commissionFor, loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';

// The monetization model of the brand (docs/12, docs/22). Only "commission" exists today;
// a subscription becomes a new strategy when it is decided.
const STRATEGIES = {
  commission: (env: Bindings) => {
    const { commission } = loadBrand(env.BRAND);
    return (price: number, seats: number) => commissionFor(commission, price, seats);
  },
} as const;

export const bookingCommission = (env: Bindings) => STRATEGIES[loadBrand(env.BRAND).monetization](env);
