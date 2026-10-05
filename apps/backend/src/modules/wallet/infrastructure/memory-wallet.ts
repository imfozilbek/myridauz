import type { WalletRepository } from '../application/ports';
import { balanceOf, OVERDRAW, type Operation } from '../domain/ledger';
import { burnable } from '../domain/promo';

const burnRow = (driverId: number, amount: number, now: number, id: string): Operation => ({
  id,
  driverId,
  kind: 'bonus_expired',
  balance: 'bonus',
  amount,
  bookingId: null,
  reason: null,
  createdBy: null,
  expiresAt: null,
  createdAt: now,
});
const onceKey = (op: Operation) => (op.bookingId ? `${op.bookingId}:${op.kind}:${op.balance}` : null);

// The same rules as D1 without a database: all rows or none, one commission and refund per booking.
export function createMemoryWallet(): WalletRepository {
  const rows: Operation[] = [];
  return {
    operations: async (driverId) => rows.filter((op) => op.driverId === driverId),
    append: async (operations) => {
      const taken = new Set(rows.map(onceKey).filter((key) => key !== null));
      const keys = operations.map(onceKey).filter((key) => key !== null);
      if (keys.some((key) => taken.has(key)) || new Set(keys).size !== keys.length) return false;
      // Like the trigger of migrations/0018: a commission never takes a balance below zero.
      for (const op of operations) {
        const held = rows.filter((row) => row.driverId === op.driverId && row.balance === op.balance);
        const sum = held.reduce((total, row) => total + row.amount, 0);
        if (op.kind === 'commission' && sum + op.amount < 0) throw new Error(OVERDRAW);
      }
      rows.push(...operations);
      return true;
    },
    withJournal: async (driverIds) => driverIds.filter((id) => rows.some((op) => op.driverId === id)),
    balances: async (offset, limit) =>
      [...new Set(rows.map((op) => op.driverId))]
        .map((driverId) => {
          const own = rows.filter((op) => op.driverId === driverId);
          return { driverId, bonus: balanceOf(own, 'bonus'), main: balanceOf(own, 'main') };
        })
        .sort((a, b) => a.main - b.main || a.driverId - b.driverId)
        .slice(offset, offset + limit),
    burnExpired: async (now, since, newId) => {
      const ended = (op: Operation) =>
        op.balance === 'bonus' && op.expiresAt !== null && op.expiresAt > since && op.expiresAt <= now;
      for (const driverId of new Set(rows.filter(ended).map((op) => op.driverId))) {
        const amount = burnable(
          rows.filter((op) => op.driverId === driverId),
          now,
        );
        if (amount > 0) rows.push(burnRow(driverId, -amount, now, newId()));
      }
    },
  };
}
