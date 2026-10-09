import type { Wallet } from '@platform/contracts';
import { balanceOf } from '../domain/ledger';
import { bonusExpiresAt } from '../domain/promo';
import type { WalletDeps } from './ports';

const HISTORY_LIMIT = 100;

// No money confirms no seat; money without a price of a trip yet says nothing (G65).
const seatsLeft = (total: number, perSeat: number | null) =>
  total <= 0 ? 0 : perSeat === null ? null : Math.floor(total / perSeat);

// «Hamyon» (docs/12, G65 mockup g65/1): the balances, how many seats they still confirm, and the
// latest operations, the newest first. A row of a booking names its passenger and seats: «Komissiya ·
// Sardor, 2 joy», «Qaytarildi · Akmal kelmadi» (docs/129, G63).
export async function walletView(deps: WalletDeps, driverId: number): Promise<Wallet> {
  const operations = await deps.wallet.operations(driverId);
  const latest = operations.slice(-HISTORY_LIMIT).reverse();
  const bookingIds = [...new Set(latest.flatMap((op) => op.bookingId ?? []))];
  const [bookings, price] = await Promise.all([
    bookingIds.length > 0 ? deps.bookings(bookingIds) : new Map(),
    deps.lastPrice(driverId),
  ]);
  const bonus = balanceOf(operations, 'bonus');
  const main = balanceOf(operations, 'main');
  return {
    bonus,
    main,
    bonusExpiresAt: bonus > 0 ? bonusExpiresAt(operations) : null,
    seatsLeft: seatsLeft(bonus + main, price === null ? null : deps.perSeat(price)),
    operations: latest.map((op) => {
      const { id, kind, balance, amount, bookingId, reason, createdAt } = op;
      const row = { id, kind, balance, amount, bookingId, reason, createdAt };
      const booking = bookings.get(bookingId ?? '');
      return booking ? { ...row, passenger: booking.passenger, seats: booking.seats } : row;
    }),
  };
}
