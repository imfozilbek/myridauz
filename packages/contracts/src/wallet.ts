import { z } from 'zod';
import { personIdSchema, type PersonId } from './person-id';

// The driver's wallet (docs/12): an append-only journal, the balance is the sum of it. G08.
export const WALLET_PATH = '/driver/wallet';
export const ADMIN_WALLETS_PATH = '/admin/wallets';
export const adminWalletPath = (driverId: PersonId) => `${ADMIN_WALLETS_PATH}/${driverId}`;
export const adminWalletAdjustPath = (driverId: PersonId) => `${adminWalletPath(driverId)}/adjust`;

export const BALANCES = ['bonus', 'main'] as const;
export type BalanceKind = (typeof BALANCES)[number];
export const OPERATION_KINDS = [
  'bonus_grant',
  'bonus_expired',
  'commission',
  'refund',
  'admin_adjustment',
] as const;
export type OperationKind = (typeof OPERATION_KINDS)[number];
// The reason of the refund of a no-show the owner confirmed (docs/35): the row names the booking.
export const NO_SHOW_REASON = 'no_show';

export const walletOperationSchema = z.object({
  id: z.string(),
  kind: z.enum(OPERATION_KINDS),
  balance: z.enum(BALANCES),
  // Whole sums, plus for money in, minus for money out.
  amount: z.number().int(),
  bookingId: z.string().nullable(),
  reason: z.string().nullable(),
  createdAt: z.number().int(),
  // The passenger and the seats of the booking of a commission or a refund: «Komissiya · Sardor,
  // 2 joy» (G65, mockup g65/1); a no-show refund: «Qaytarildi · Akmal kelmadi» (G63).
  passenger: z.string().optional(),
  seats: z.number().int().optional(),
});
export type WalletOperation = z.infer<typeof walletOperationSchema>;

// Fewer seats than this the money still confirms: «Hamyon» turns red and asks to top up (mockup
// g65/1 phone 2), the driver bot says it once (G68, docs/122).
export const FEW_SEATS = 5;

export const walletSchema = z.object({
  bonus: z.number().int(),
  main: z.number().int(),
  // The current bonus burns at this time if it is not spent (docs/12).
  bonusExpiresAt: z.number().int().nullable(),
  // «≈ 52 joyga yetadi» (G65, mockup g65/1): the seats the balances still confirm at the seat price
  // of the driver's last trip; 0 with no money; null with money but no trip yet.
  seatsLeft: z.number().int().nullable(),
  operations: z.array(walletOperationSchema),
});
export type Wallet = z.infer<typeof walletSchema>;

export const adminWalletsSchema = z.object({
  wallets: z.array(
    z.object({
      driverId: personIdSchema,
      firstName: z.string(),
      bonus: z.number().int(),
      main: z.number().int(),
    }),
  ),
  // More drivers after this page (G42): "Yana koʻrsatish" asks for the next one.
  more: z.boolean(),
});
export type AdminWallets = z.infer<typeof adminWalletsSchema>;

// A hand correction by an owner (docs/12, docs/35): a bonus by hand or a refund for a no-show.
const MAX_ADJUSTMENT = 10_000_000;
const REASON_MAX = 200;
export const adjustmentSchema = z.object({
  balance: z.enum(BALANCES),
  amount: z
    .number()
    .int()
    .min(-MAX_ADJUSTMENT)
    .max(MAX_ADJUSTMENT)
    .refine((amount) => amount !== 0),
  reason: z.string().trim().min(3).max(REASON_MAX),
});
export type Adjustment = z.input<typeof adjustmentSchema>;
