import { CANCEL_REASONS, type CancelReasonCount, type CancelWhat } from '@platform/contracts';
import type { Counter } from './counters';

const TOP = 10;
const isWhat = (what: string): what is CancelWhat => what in CANCEL_REASONS;

// The reasons of cancels and deletions of a period, from the codes «booking.plans» (G87 V3): the
// most given first, an odd code left out.
export function cancelReasonsOf(counters: readonly Counter[]): CancelReasonCount[] {
  const counts = new Map<string, CancelReasonCount>();
  for (const { name, code, events } of counters) {
    const [what = '', reason = ''] = code.split('.');
    if (name !== 'cancel_reason' || !isWhat(what)) continue;
    const known = CANCEL_REASONS[what].find((one) => one === reason);
    if (!known) continue;
    const earlier = counts.get(code)?.count ?? 0;
    counts.set(code, { what, reason: known, count: earlier + events });
  }
  return [...counts.values()].sort((one, other) => other.count - one.count).slice(0, TOP);
}
