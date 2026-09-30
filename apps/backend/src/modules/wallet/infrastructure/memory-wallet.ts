import type { WalletRepository } from '../application/ports';
import { OVERDRAW, type Operation } from '../domain/ledger';

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
    drivers: async () => [...new Set(rows.map((op) => op.driverId))],
  };
}
