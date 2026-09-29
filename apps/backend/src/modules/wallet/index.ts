import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { peopleOf } from '../users';
import type { WalletDeps } from './application/ports';
import { grantMissedWelcome } from './application/missed';
import { burnExpired, canAfford, charge, grantWelcome, refund } from './application/wallet';
import { walletRoutes } from './http/wallet-routes';
import { d1Wallet } from './infrastructure/d1-wallet';
import { createMemoryWallet } from './infrastructure/memory-wallet';

// Without D1 (tests) the journal lives in memory.
const localWallet = createMemoryWallet();

const walletDeps = (env: Bindings): WalletDeps => ({
  wallet: env.DB ? d1Wallet(env.DB) : localWallet,
  promo: loadBrand(env.BRAND).promo,
  people: peopleOf(env),
  now: Date.now,
  newId: () => crypto.randomUUID(),
});

export const walletModule = walletRoutes(walletDeps);

// For bookings: the commission at the confirmation and its refund (docs/12).
export const walletCanAfford = (env: Bindings, driverId: number, amount: number) =>
  canAfford(walletDeps(env), driverId, amount);
export const chargeCommission = (env: Bindings, driverId: number, bookingId: string, amount: number) =>
  charge(walletDeps(env), driverId, bookingId, amount);
export const refundCommission = (env: Bindings, driverId: number, bookingId: string) =>
  refund(walletDeps(env), driverId, bookingId);
// For drivers: bonus 1 at the approval. For the Cron job: burning bonuses that are over.
export const welcomeBonus = (env: Bindings, driverId: number) => grantWelcome(walletDeps(env), driverId);
export const burnBonuses = (env: Bindings) => burnExpired(walletDeps(env));
export const missedWelcome = (env: Bindings, approved: readonly number[]) =>
  grantMissedWelcome(walletDeps(env), approved);
