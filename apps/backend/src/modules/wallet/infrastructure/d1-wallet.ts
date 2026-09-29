import type { BalanceKind, OperationKind } from '@platform/contracts';
import type { WalletRepository } from '../application/ports';
import type { Operation } from '../domain/ledger';

type Row = {
  id: string;
  driver_id: number;
  kind: OperationKind;
  balance: BalanceKind;
  amount: number;
  booking_id: string | null;
  reason: string | null;
  created_by: number | null;
  expires_at: number | null;
  created_at: number;
};

const toOperation = (row: Row): Operation => ({
  id: row.id,
  driverId: row.driver_id,
  kind: row.kind,
  balance: row.balance,
  amount: row.amount,
  bookingId: row.booking_id,
  reason: row.reason,
  createdBy: row.created_by,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
});

const INSERT = `INSERT INTO wallet_operations
  (id, driver_id, kind, balance, amount, booking_id, reason, created_by, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// Table wallet_operations (migrations/0008_bookings_wallet.sql): rows are only added.
export const d1Wallet = (db: D1Database): WalletRepository => ({
  operations: async (driverId) =>
    (
      await db
        .prepare('SELECT * FROM wallet_operations WHERE driver_id = ? ORDER BY created_at, rowid')
        .bind(driverId)
        .all<Row>()
    ).results.map(toOperation),
  append: async (operations) => {
    const statements = operations.map((op) =>
      db
        .prepare(INSERT)
        .bind(
          op.id,
          op.driverId,
          op.kind,
          op.balance,
          op.amount,
          op.bookingId,
          op.reason,
          op.createdBy,
          op.expiresAt,
          op.createdAt,
        ),
    );
    try {
      // A batch is one transaction: the unique index (booking, kind, balance) stops a second charge.
      await db.batch(statements);
      return true;
    } catch (error) {
      if (String(error).includes('UNIQUE')) return false;
      throw error;
    }
  },
  drivers: async () =>
    (
      await db.prepare('SELECT DISTINCT driver_id FROM wallet_operations').all<{ driver_id: number }>()
    ).results.map((row) => row.driver_id),
});
