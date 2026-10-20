import { DAY_MS, type Adjustment, type OperationKind } from '@platform/contracts';
import { balanceOf, chargedFor, returnedFor, splitCharge, type Operation } from '../domain/ledger';
import { appendCharge } from './append-charge';
import { burnable, nextGrant, welcomeGrant, type Grant } from '../domain/promo';
import type { WalletDeps } from './ports';
import { tellFewSeats } from './wallet-news';

type Row = Pick<Operation, 'kind' | 'balance' | 'amount'> & Partial<Operation>;
const EMPTY = { bookingId: null, reason: null, createdBy: null, expiresAt: null } as const;

export const row = (deps: WalletDeps, driverId: number, input: Row): Operation => ({
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
    grantNo: grant.no,
  });

// A bonus whose time is over is not money any more, even before the Cron job burns it.
export const usable = (operations: readonly Operation[], now: number): Operation[] => {
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

// The money for a seat: a bonus rest too small for it brings the next bonus first (G89 M1).
function forSeat(deps: WalletDeps, driverId: number, operations: readonly Operation[], amount: number) {
  const old = usable(operations, deps.now());
  const early = splitCharge(old, amount) ? null : nextGrant(old, deps.promo, deps.now(), amount);
  const first = early ? [grantRow(deps, driverId, early)] : [];
  return { held: [...old, ...first], first };
}

export async function canAfford(deps: WalletDeps, driverId: number, amount: number) {
  const { held } = forSeat(deps, driverId, await deps.wallet.operations(driverId), amount);
  return splitCharge(held, amount) !== null;
}

// How much is missing for this commission: 0 when the money is there (G75, docs/158 Г).
export async function shortage(deps: WalletDeps, driverId: number, amount: number) {
  const { held } = forSeat(deps, driverId, await deps.wallet.operations(driverId), amount);
  const money = Math.max(0, balanceOf(held, 'bonus')) + Math.max(0, balanceOf(held, 'main'));
  return Math.max(0, amount - money);
}

type Charged = 'ok' | 'not_enough' | 'duplicate';

// The commission at the confirmation (docs/12): the bonus first. 'duplicate': it is already taken.
// A bonus burnt or another charge between the read and the write: one more read decides (G89 M15).
export async function charge(deps: WalletDeps, driverId: number, bookingId: string, amount: number) {
  const charged = await chargeOnce(deps, driverId, bookingId, amount);
  return charged === 'not_enough' ? chargeOnce(deps, driverId, bookingId, amount) : charged;
}

async function chargeOnce(
  deps: WalletDeps,
  driverId: number,
  bookingId: string,
  amount: number,
): Promise<Charged> {
  const operations = await deps.wallet.operations(driverId);
  const { held, first } = forSeat(deps, driverId, operations, amount);
  const split = splitCharge(held, amount);
  if (!split) return 'not_enough';
  if (first.length > 0) await deps.wallet.append(first);
  const rows = (['bonus', 'main'] as const)
    .filter((balance) => split[balance] > 0)
    .map((balance) =>
      row(deps, driverId, { kind: 'commission', balance, amount: -split[balance], bookingId }),
    );
  const appended = await appendCharge(deps.wallet, rows);
  if (appended !== 'ok') return appended;
  const next = nextGrant([...operations, ...first, ...rows], deps.promo, deps.now());
  const granted = next ? [grantRow(deps, driverId, next)] : [];
  if (granted.length > 0) await deps.wallet.append(granted);
  await tellFewSeats(deps, driverId, held, [...held, ...rows, ...granted]);
  return 'ok';
}

// The passenger cancelled: the commission goes back to the balances it came from (docs/12), once.
export async function refund(deps: WalletDeps, driverId: number, bookingId: string): Promise<void> {
  const operations = await deps.wallet.operations(driverId);
  if (returnedFor(operations, bookingId)) return;
  const taken = chargedFor(operations, bookingId);
  const rows = (['bonus', 'main'] as const)
    .filter((balance) => taken[balance] > 0)
    .map((balance) => row(deps, driverId, { kind: 'refund', balance, amount: taken[balance], bookingId }));
  if (rows.length > 0) await deps.wallet.append(rows);
}

// Bonus 1 at the approval of the driver (docs/12).
// The grant, or null for a driver who had it already: the approval message names it (docs/89 D4).
export async function grantWelcome(deps: WalletDeps, driverId: number): Promise<Grant | null> {
  const grant = welcomeGrant(await deps.wallet.operations(driverId), deps.promo, deps.now());
  if (grant) await deps.wallet.append([grantRow(deps, driverId, grant)]);
  return grant;
}

// The Cron job: a bonus not spent in its days burns (docs/12), all drivers in one step (G42).
// The job runs every hour: a week back covers any days the Cron did not run (G56).
const BURN_LOOKBACK_MS = 7 * DAY_MS;

export const burnExpired = (deps: WalletDeps) => {
  const now = deps.now();
  return deps.wallet.burnExpired(now, now - BURN_LOOKBACK_MS, deps.newId);
};

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
