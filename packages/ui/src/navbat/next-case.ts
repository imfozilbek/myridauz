import type { NavbatItem, NavbatKind } from '@platform/contracts';
import type { NavbatFilter } from '../flow/start-action';

// One case of «Navbat»: its kind and id (docs/120).
export type CaseKey = { readonly kind: NavbatKind; readonly id: string };
// «2 / 9»: the case on the screen and all the cases of this visit (mockup g67/2 screens 3 … 5).
export type Progress = { readonly n: number; readonly m: number };

const same = (a: CaseKey, b: CaseKey) => a.kind === b.kind && a.id === b.id;

// The cases of the filter not decided in this visit, the oldest first.
function waiting(items: readonly NavbatItem[], filter: NavbatFilter, done: readonly CaseKey[]) {
  return items.filter(
    (item) => (filter === 'all' || item.kind === filter) && !done.some((key) => same(key, item)),
  );
}

// After a decision the next case opens by itself: the oldest of the filter that no other member
// opened, else the oldest; nothing left: «Hammasi koʻrildi» (docs/120).
export function nextCase(
  items: readonly NavbatItem[],
  filter: NavbatFilter,
  done: readonly CaseKey[],
): NavbatItem | null {
  const left = waiting(items, filter, done);
  return left.find((item) => item.takenBy === null) ?? left[0] ?? null;
}

// The decided cases count too: «2 / 9» after the first decision of nine.
export function progressOf(
  items: readonly NavbatItem[],
  filter: NavbatFilter,
  done: readonly CaseKey[],
): Progress {
  const left = waiting(items, filter, done).length;
  return { n: done.length + 1, m: done.length + Math.max(left, 1) };
}
