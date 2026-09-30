import { OVERDRAW, type Operation } from '../domain/ledger';
import type { WalletRepository } from './ports';

// The rows of a commission: 'duplicate' when this booking is charged already, 'not_enough' when
// another charge took the money in the same moment (the database guard, docs/65 A4).
export async function appendCharge(
  wallet: WalletRepository,
  rows: readonly Operation[],
): Promise<'ok' | 'duplicate' | 'not_enough'> {
  try {
    return (await wallet.append(rows)) ? 'ok' : 'duplicate';
  } catch (error) {
    if (String(error).includes(OVERDRAW)) return 'not_enough';
    throw error;
  }
}
