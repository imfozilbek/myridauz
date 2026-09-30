import { balanceOf, type Operation } from '../domain/ledger';
import type { WalletDeps } from './ports';

// "Maʼlumotlarimni oʻchirish" (docs/65 A5): a new account of the same person starts with an empty
// wallet. The rows stay, as every row of the journal does; two rows bring both balances to zero.
export async function closeWallet(deps: WalletDeps, driverId: number): Promise<void> {
  const operations = await deps.wallet.operations(driverId);
  const at = deps.now();
  const closing = (
    [
      ['bonus', 'bonus_expired'],
      ['main', 'admin_adjustment'],
    ] as const
  )
    .map(([balance, kind]): Operation => ({
      id: deps.newId(),
      driverId,
      kind,
      balance,
      amount: -balanceOf(operations, balance),
      bookingId: null,
      reason: 'account_deleted',
      createdBy: null,
      expiresAt: null,
      createdAt: at,
    }))
    .filter((operation) => operation.amount !== 0);
  if (closing.length > 0) await deps.wallet.append(closing);
}
