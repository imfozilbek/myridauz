import { z } from 'zod';
import { bookingSchema } from './bookings';
import { BALANCES, WALLET_PATH } from './wallet';

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
