import { detailKindOf, type WalletDetail } from '@platform/contracts';
import type { WalletDeps } from './ports';

// The details of a commission or of its refund «Qaytarildi» (G65, mockup g65/2): the operation must be
// the driver's own and belong to a booking. One that took both balances is one sum, both balances named.
export async function walletDetail(
  deps: WalletDeps,
  driverId: number,
  operationId: string,
): Promise<WalletDetail | null> {
  const operations = await deps.wallet.operations(driverId);
  const row = operations.find((op) => op.id === operationId);
  const kind = row ? detailKindOf(row) : null;
  if (!row?.bookingId || !kind) return null;
  const booking = await deps.booking(row.bookingId);
  if (!booking) return null;
  const same = operations.filter((op) => op.bookingId === row.bookingId && detailKindOf(op) === kind);
  return {
    kind,
    amount: same.reduce((sum, op) => sum + op.amount, 0),
    balances: [...new Set(same.map((op) => op.balance))],
    createdAt: row.createdAt,
    booking,
  };
}
