import type { BalanceKind, OperationKind } from '@platform/contracts';

// One row of the append-only journal (docs/12). Whole sums; plus in, minus out.
export type Operation = {
  readonly id: string;
  readonly driverId: number;
  readonly kind: OperationKind;
  readonly balance: BalanceKind;
  readonly amount: number;
  readonly bookingId: string | null;
  readonly reason: string | null;
  readonly createdBy: number | null;
  // A bonus lives until this time (a grant or a bonus given by hand).
  readonly expiresAt: number | null;
  readonly createdAt: number;
};

export type Split = Readonly<Record<BalanceKind, number>>;

// The database refuses a commission that would take a balance below zero (migrations/0018).
export const OVERDRAW = 'wallet.overdraw';

export const balanceOf = (operations: readonly Operation[], balance: BalanceKind) =>
  operations.reduce((sum, operation) => (operation.balance === balance ? sum + operation.amount : sum), 0);

// The bonus goes first, then the main balance (docs/12). null: there is not enough.
export function splitCharge(operations: readonly Operation[], amount: number): Split | null {
  const bonus = Math.max(0, balanceOf(operations, 'bonus'));
  const main = Math.max(0, balanceOf(operations, 'main'));
  if (bonus + main < amount) return null;
  const fromBonus = Math.min(bonus, amount);
  return { bonus: fromBonus, main: amount - fromBonus };
}

// What the commission of a booking took from each balance: a refund goes back the same way.
export function chargedFor(operations: readonly Operation[], bookingId: string): Split {
  const taken = (balance: BalanceKind) =>
    -operations
      .filter((op) => op.bookingId === bookingId && op.kind === 'commission' && op.balance === balance)
      .reduce((sum, op) => sum + op.amount, 0);
  return { bonus: taken('bonus'), main: taken('main') };
}

// The commission of a booking went back already: by a cancel or by the owner on a no-show.
// It goes back once (docs/35).
export const returnedFor = (operations: readonly Operation[], bookingId: string) =>
  operations.some((op) => op.bookingId === bookingId && op.kind !== 'commission');
