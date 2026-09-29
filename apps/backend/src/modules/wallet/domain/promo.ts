import type { PromoRule } from '@platform/brands';
import { balanceOf, type Operation } from './ledger';

const DAY_MS = 24 * 60 * 60 * 1000;
export type Grant = { readonly amount: number; readonly expiresAt: number };

const grants = (operations: readonly Operation[]) => operations.filter((op) => op.kind === 'bonus_grant');

// The bonus lives until the latest bonus that came in: a grant or one given by hand.
export function bonusExpiresAt(operations: readonly Operation[]): number | null {
  const lives = operations.flatMap((op) => (op.balance === 'bonus' && op.expiresAt ? [op.expiresAt] : []));
  return lives.length === 0 ? null : Math.max(...lives);
}

const grant = (rule: PromoRule, now: number): Grant => ({
  amount: rule.amount,
  expiresAt: now + rule.days * DAY_MS,
});

// Bonus 1 right after the approval, once: a driver approved again after a new photo gets nothing.
export const welcomeGrant = (operations: readonly Operation[], rule: PromoRule, now: number) =>
  grants(operations).length === 0 ? grant(rule, now) : null;

// The next bonus comes at once when the previous one is spent in its days, within the window
// after the approval, at most `grants` times (docs/12, question 27).
export function nextGrant(operations: readonly Operation[], rule: PromoRule, now: number): Grant | null {
  const given = grants(operations);
  const first = given[0];
  const latest = given.at(-1);
  if (!first || !latest || given.length >= rule.grants) return null;
  if (balanceOf(operations, 'bonus') > 0) return null;
  if (latest.expiresAt === null || now >= latest.expiresAt) return null;
  return now < first.createdAt + rule.windowDays * DAY_MS ? grant(rule, now) : null;
}

// What burns now: the whole bonus once its time is over; a refund to an old bonus burns too.
export function burnable(operations: readonly Operation[], now: number): number {
  const bonus = balanceOf(operations, 'bonus');
  if (bonus <= 0) return 0;
  const until = bonusExpiresAt(operations);
  return until === null || now >= until ? bonus : 0;
}
