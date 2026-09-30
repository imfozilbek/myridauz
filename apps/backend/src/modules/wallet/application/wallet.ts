import type { AdminWallets, Adjustment, BalanceKind, OperationKind, Wallet } from '@platform/contracts';
import { balanceOf, chargedFor, splitCharge, type Operation } from '../domain/ledger';
import { appendCharge } from './append-charge';
import { bonusExpiresAt, burnable, nextGrant, welcomeGrant, type Grant } from '../domain/promo';
import type { WalletDeps } from './ports';

type Row = Pick<Operation, 'kind' | 'balance' | 'amount'> & Partial<Operation>;
const HISTORY_LIMIT = 100;
const EMPTY = { bookingId: null, reason: null, createdBy: null, expiresAt: null } as const;

const row = (deps: WalletDeps, driverId: number, input: Row): Operation => ({
  ...EMPTY,
  id: deps.newId(),
  driverId,
  createdAt: deps.now(),
  ...input,
});
const grantRow = (deps: WalletDeps, driverId: number, grant: Grant) =>
  row(deps, driverId, {
    kind: 'bonus_grant',
    balance: 'bonus',
    amount: grant.amount,
    expiresAt: grant.expiresAt,
  });

export async function walletView(deps: WalletDeps, driverId: number): Promise<Wallet> {
  const operations = await deps.wallet.operations(driverId);
  return {
    bonus: balanceOf(operations, 'bonus'),
    main: balanceOf(operations, 'main'),
    bonusExpiresAt: balanceOf(operations, 'bonus') > 0 ? bonusExpiresAt(operations) : null,
    operations: operations
      .slice(-HISTORY_LIMIT)
      .reverse()
      .map(({ id, kind, balance, amount, bookingId, reason, createdAt }) => ({
        id,
        kind,
        balance,
        amount,
        bookingId,
        reason,
        createdAt,
      })),
  };
}

// A bonus whose time is over is not money any more, even before the Cron job burns it.
const usable = (operations: readonly Operation[], now: number): Operation[] => {
  const burnt = burnable(operations, now);
  if (burnt === 0) return [...operations];
  const burn: Operation = {
    ...EMPTY,
    id: 'burn',
    driverId: 0,
    kind: 'bonus_expired',
    balance: 'bonus',
    amount: -burnt,
    createdAt: now,
  };
  return [...operations, burn];
};

export async function canAfford(deps: WalletDeps, driverId: number, amount: number) {
  return splitCharge(usable(await deps.wallet.operations(driverId), deps.now()), amount) !== null;
}

// The commission at the confirmation (docs/12): the bonus first. 'duplicate': it is already taken.
export async function charge(
  deps: WalletDeps,
  driverId: number,
  bookingId: string,
  amount: number,
): Promise<'ok' | 'not_enough' | 'duplicate'> {
  const operations = await deps.wallet.operations(driverId);
  const split = splitCharge(usable(operations, deps.now()), amount);
  if (!split) return 'not_enough';
  const rows = (['bonus', 'main'] as const)
    .filter((balance) => split[balance] > 0)
    .map((balance) =>
      row(deps, driverId, { kind: 'commission', balance, amount: -split[balance], bookingId }),
    );
  const appended = await appendCharge(deps.wallet, rows);
  if (appended !== 'ok') return appended;
  const next = nextGrant([...operations, ...rows], deps.promo, deps.now());
  if (next) await deps.wallet.append([grantRow(deps, driverId, next)]);
  return 'ok';
}

// The passenger cancelled: the commission goes back to the balances it came from (docs/12).
export async function refund(deps: WalletDeps, driverId: number, bookingId: string): Promise<void> {
  const taken = chargedFor(await deps.wallet.operations(driverId), bookingId);
  const rows = (['bonus', 'main'] as const)
    .filter((balance) => taken[balance] > 0)
    .map((balance) => row(deps, driverId, { kind: 'refund', balance, amount: taken[balance], bookingId }));
  if (rows.length > 0) await deps.wallet.append(rows);
}

// Bonus 1 at the approval of the driver (docs/12).
export async function grantWelcome(deps: WalletDeps, driverId: number): Promise<void> {
  const grant = welcomeGrant(await deps.wallet.operations(driverId), deps.promo, deps.now());
  if (grant) await deps.wallet.append([grantRow(deps, driverId, grant)]);
}

// The Cron job: a bonus not spent in its days burns (docs/12).
export async function burnExpired(deps: WalletDeps): Promise<void> {
  for (const driverId of await deps.wallet.drivers()) {
    const amount = burnable(await deps.wallet.operations(driverId), deps.now());
    if (amount > 0) {
      await deps.wallet.append([
        row(deps, driverId, { kind: 'bonus_expired', balance: 'bonus', amount: -amount }),
      ]);
    }
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// A hand correction by an owner with a reason: a bonus by hand (it lives like a grant) or a refund
// for a no-show (docs/12, docs/35). A balance never goes below zero.
export async function adjust(
  deps: WalletDeps,
  ownerId: number,
  driverId: number,
  input: Required<Adjustment>,
): Promise<'ok' | 'not_enough'> {
  const operations = await deps.wallet.operations(driverId);
  if (balanceOf(operations, input.balance) + input.amount < 0) return 'not_enough';
  const kind: OperationKind = 'admin_adjustment';
  const lives = input.balance === 'bonus' && input.amount > 0;
  const expiresAt = lives ? deps.now() + deps.promo.days * DAY_MS : null;
  const { balance, amount, reason } = input;
  await deps.wallet.append([
    row(deps, driverId, { kind, balance, amount, reason, createdBy: ownerId, expiresAt }),
  ]);
  return 'ok';
}

export async function adminWallets(deps: WalletDeps): Promise<AdminWallets['wallets']> {
  const drivers = await deps.wallet.drivers();
  return Promise.all(
    drivers.map(async (driverId) => {
      const [operations, person] = await Promise.all([
        deps.wallet.operations(driverId),
        deps.people.find(driverId),
      ]);
      const sum = (balance: BalanceKind) => balanceOf(operations, balance);
      return { driverId, firstName: person?.firstName ?? '', bonus: sum('bonus'), main: sum('main') };
    }),
  );
}
