import { z } from 'zod';
import { bookingSchema } from './bookings';
import { BALANCES, NO_SHOW_REASON, WALLET_PATH, type OperationKind } from './wallet';

// The details of a commission or of its refund (G65, mockup g65/2): the trip, the passenger, the
// count, the balances it came from, «Safarni ochish». The booking is the driver's own view of it.
export const walletOperationPath = (operationId: string) => `${WALLET_PATH}/${operationId}`;

export const walletDetailSchema = z.object({
  kind: z.enum(['commission', 'refund']),
  // The whole commission of the booking or the whole refund: one sum even when it took both balances.
  amount: z.number().int(),
  balances: z.array(z.enum(BALANCES)),
  createdAt: z.number().int(),
  booking: bookingSchema,
});
export type WalletDetail = z.infer<typeof walletDetailSchema>;

// The operations that open: a commission, or money that came back for a booking (a cancel, or a
// no-show the owner confirmed). Every other row of «Hamyon» has no details.
export function detailKindOf(operation: {
  readonly kind: OperationKind;
  readonly reason: string | null;
}): WalletDetail['kind'] | null {
  if (operation.kind === 'commission') return 'commission';
  const noShow = operation.kind === 'admin_adjustment' && operation.reason === NO_SHOW_REASON;
  return operation.kind === 'refund' || noShow ? 'refund' : null;
}
