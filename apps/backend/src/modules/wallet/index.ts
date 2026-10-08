import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { sendSignals } from '../feed';
import { peopleOf } from '../users';
import type { WalletDeps } from './application/ports';
import { closeWallet } from './application/close';
import { grantMissedWelcome } from './application/missed';
import { refundNoShow as refundOnce } from './application/no-show-refund';
import { burnExpired, canAfford, charge, grantWelcome, refund } from './application/wallet';
import { walletRoutes } from './http/wallet-routes';
import { d1Wallet } from './infrastructure/d1-wallet';
import { createMemoryWallet } from './infrastructure/memory-wallet';

// Without D1 (tests) the journal lives in memory.
const localWallet = createMemoryWallet();

// The first names of the passengers of bookings (G63): set by the app (module-events.ts).
type Names = (env: Bindings, bookingIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
let passengerNames: Names = async () => new Map();
export const wireWalletNames = (names: Names) => void (passengerNames = names);

const walletDeps = (env: Bindings): WalletDeps => ({
  wallet: env.DB ? d1Wallet(env.DB) : localWallet,
  promo: loadBrand(env.BRAND).promo,
  people: peopleOf(env),
  passengers: (bookingIds) => passengerNames(env, bookingIds),
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

// A no-show on a complaint: the owner confirmed the refund the moderator proposed (docs/35, G63).
// The open «Hamyon» of the driver shows it at once (docs/64).
export async function refundNoShow(env: Bindings, ownerId: number, driverId: number, bookingId: string) {
  const result = await refundOnce(walletDeps(env), ownerId, driverId, bookingId);
  if (result === 'ok') await sendSignals(env, [{ userId: driverId, app: 'driver' }]);
  return result;
}

// A deleted account: both balances go to zero (docs/65 A5).
export const closeWalletOf = (env: Bindings, driverId: number) => closeWallet(walletDeps(env), driverId);
