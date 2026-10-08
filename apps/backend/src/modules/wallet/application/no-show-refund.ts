import { BALANCES, NO_SHOW_REASON } from '@platform/contracts';
import { chargedFor, returnedFor } from '../domain/ledger';
import type { WalletDeps } from './ports';
import { row } from './wallet';

// The owner confirmed the refund of a no-show (docs/35, G63): the commission of the booking goes
// back to the balances it came from (docs/12), as admin_adjustment rows linked to the booking.
// Once: a booking a cancel refunded already, or this refund twice, gives nothing more; the unique
// index of the journal (booking, kind, balance) stops two answers at the same moment.
export async function refundNoShow(
  deps: WalletDeps,
  ownerId: number,
  driverId: number,
  bookingId: string,
): Promise<'ok' | 'nothing'> {
  const operations = await deps.wallet.operations(driverId);
  if (returnedFor(operations, bookingId)) return 'nothing';
  const taken = chargedFor(operations, bookingId);
  const kind = 'admin_adjustment' as const;
  const rows = BALANCES.filter((balance) => taken[balance] > 0).map((balance) =>
    row(deps, driverId, {
      kind,
      balance,
      amount: taken[balance],
      bookingId,
      reason: NO_SHOW_REASON,
      createdBy: ownerId,
    }),
  );
  if (rows.length === 0) return 'nothing';
  return (await deps.wallet.append(rows)) ? 'ok' : 'nothing';
}
