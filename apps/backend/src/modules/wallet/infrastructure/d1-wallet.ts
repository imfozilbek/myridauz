import type { BalanceKind, OperationKind } from '@platform/contracts';
import { allIn } from '../../../shared/storage/in-list';
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

// The bonus of every driver whose latest bonus time is over burns (docs/12, the same rule as
// domain/promo burnable): one statement for all drivers (G42). The id is new for each row. Only
// the drivers whose bonus time ended after ?3 are read, through wallet_bonus_ends (G56).
const BURN = `INSERT INTO wallet_operations (id, driver_id, kind, balance, amount, created_at)
  SELECT ?2 || '-' || driver_id, driver_id, 'bonus_expired', 'bonus', -SUM(amount), ?1
  FROM wallet_operations WHERE balance = 'bonus' AND driver_id IN (SELECT driver_id FROM wallet_operations
    WHERE balance = 'bonus' AND expires_at > ?3 AND expires_at <= ?1)
  GROUP BY driver_id
  HAVING SUM(amount) > 0 AND (MAX(expires_at) IS NULL OR MAX(expires_at) <= ?1)`;

// The balances of one page of drivers, the least main money first (G42, docs/90 F-A5).
const BALANCES = `SELECT driver_id,
  SUM(CASE WHEN balance = 'bonus' THEN amount ELSE 0 END) AS bonus,
  SUM(CASE WHEN balance = 'main' THEN amount ELSE 0 END) AS main
  FROM wallet_operations GROUP BY driver_id ORDER BY main, driver_id LIMIT ? OFFSET ?`;

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
  balances: async (offset, limit) =>
    (
      await db.prepare(BALANCES).bind(limit, offset).all<{ driver_id: number; bonus: number; main: number }>()
    ).results.map((row) => ({ driverId: row.driver_id, bonus: row.bonus, main: row.main })),
  burnExpired: async (now, since, newId) => {
    await db.prepare(BURN).bind(now, newId(), since).run();
  },
  withJournal: async (driverIds) =>
    (
      await allIn<{ driver_id: number }>(
        db,
        (marks) => `SELECT DISTINCT driver_id FROM wallet_operations WHERE driver_id IN (${marks})`,
        driverIds,
      )
    ).map((row) => row.driver_id),
});
