import type { WalletRepository } from '../application/ports';
import type { Operation } from '../domain/ledger';

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
      rows.push(...operations);
      return true;
    },
    drivers: async () => [...new Set(rows.map((op) => op.driverId))],
  };
}
