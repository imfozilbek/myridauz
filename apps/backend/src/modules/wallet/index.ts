import { commissionFor } from '@platform/brands';
import { isQuietTime, type Booking } from '@platform/contracts';
import type { Bindings } from '../../env';
import { sendSignals } from '../feed';
import { showCards } from '../notifications';
import { tellOwners } from '../team-queue';
import { peopleOf } from '../users';
import type { WalletBooking, WalletDeps } from './application/ports';
import { closeWallet } from './application/close';
import { grantMissedWelcome } from './application/missed';
import { refundNoShow as refundOnce } from './application/no-show-refund';
import { burnExpired, canAfford, charge, grantWelcome, refund, shortage } from './application/wallet';
import { warnBonusEnds } from './application/wallet-news';
import { walletRoutes } from './http/wallet-routes';
import { d1Wallet } from './infrastructure/d1-wallet';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { moneySign, walletCard, walletRing } from './infrastructure/wallet-card';
import { brandOf } from '../../shared/brand/brand-of';

// Without D1 (tests) the journal lives in memory.
const localWallet = createMemoryWallet();

// The bookings and the trips behind the rows (G63, G65): set by the app (module-events.ts), so the
// wallet does not depend on bookings and trips.
type Links = {
  readonly bookings: (env: Bindings, ids: readonly string[]) => Promise<ReadonlyMap<string, WalletBooking>>;
  readonly booking: (env: Bindings, id: string) => Promise<Booking | undefined>;
  readonly lastPrice: (env: Bindings, driverId: number) => Promise<number | null>;
};
let links: Links = {
  bookings: async () => new Map(),
  booking: async () => undefined,
  lastPrice: async () => null,
};
export const wireWalletLinks = (wired: Links) => void (links = wired);

const walletDeps = (env: Bindings): WalletDeps => {
  const brand = brandOf(env);
  return {
    wallet: env.DB ? d1Wallet(env.DB) : localWallet,
    promo: brand.promo,
    people: peopleOf(env),
    bookings: (ids) => links.bookings(env, ids),
    booking: (id) => links.booking(env, id),
    lastPrice: (id) => links.lastPrice(env, id),
    perSeat: (price) => commissionFor(brand.commission, price, 1),
    fewSeats: brand.wallet.fewSeats,
    // A driver may have never opened the bot: the news must not stop the commission.
    tell: async (driverId, view, news) => {
      const now = Date.now();
      const ring = walletRing(driverId, view, news, isQuietTime(now));
      await showCards(env, [walletCard(brand, driverId, view, now)], [ring]).catch((error: unknown) =>
        console.warn(JSON.stringify({ event: 'wallet_news_failed', message: String(error) })),
      );
      const person = news === 'fewSeats' ? await peopleOf(env).find(driverId) : undefined;
      if (person) await tellOwners(env, moneySign(person, view));
    },
    now: Date.now,
    newId: () => crypto.randomUUID(),
  };
};

export const walletModule = walletRoutes(walletDeps);

// For bookings: the commission at the confirmation and its refund (docs/12).
export const walletCanAfford = (env: Bindings, driverId: number, amount: number) =>
  canAfford(walletDeps(env), driverId, amount);
// For the driver bot: how much is missing for a commission (G75, docs/158 Г).
export const walletShortage = (env: Bindings, driverId: number, amount: number) =>
  shortage(walletDeps(env), driverId, amount);
export const chargeCommission = (env: Bindings, driverId: number, bookingId: string, amount: number) =>
  charge(walletDeps(env), driverId, bookingId, amount);
export const refundCommission = (env: Bindings, driverId: number, bookingId: string) =>
  refund(walletDeps(env), driverId, bookingId);
// For drivers: bonus 1 at the approval. For the Cron job: burning bonuses that are over.
export const welcomeBonus = (env: Bindings, driverId: number) => grantWelcome(walletDeps(env), driverId);
export const burnBonuses = (env: Bindings) => burnExpired(walletDeps(env));
// For the daily Cron job: the bonus ends in 3 days (G68, docs/122).
export const warnBonusEnd = (env: Bindings) => warnBonusEnds(walletDeps(env));
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
