import { useEffect, useSyncExternalStore } from 'react';
import { ACTION_ORDER, idOf, type ActionItem, type ActionKind } from './action-item';

// The things that ask the person for an action, by who brought them: the main screen of a role, a
// ringing call (docs/122). The block at the bottom calls, the sheet answers (G76, docs/164): only a
// call rises by itself; a request, an offer or a message opens from the block or a bot link.
const sources = new Map<string, readonly ActionItem[]>();
// Answered in this session: the next one of the same kind comes, this one never again.
const answered = new Set<string>();
const listeners = new Set<() => void>();
// What is open now: one kind, maybe with the thing a bot link or a tap of the block named first.
let opening: { readonly kind: ActionKind | null; readonly first: string | null } | null = null;
let queue: readonly ActionItem[] = [];

const rank = (item: ActionItem) =>
  ACTION_ORDER.indexOf(item.kind) * 2 +
  (opening?.first !== null && idOf(item.key) === opening?.first ? 0 : 1);

const shown = (item: ActionItem) =>
  item.kind === 'call' ||
  (opening !== null &&
    (opening.kind === null ? idOf(item.key) === opening.first : item.kind === opening.kind));

function changed() {
  const all = [...sources.values()].flat().filter((item) => !answered.has(item.key));
  // A bot link names a thing before its list came: its kind is known once it is here.
  const named = opening?.kind === null ? all.find((item) => idOf(item.key) === opening?.first) : undefined;
  if (named && opening) opening = { kind: named.kind, first: opening.first };
  queue = all.filter(shown).sort((a, b) => rank(a) - rank(b));
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

// A source tells what it has now; it takes its things away when it leaves the screen.
export function useActionItems(source: string, items: readonly ActionItem[]): void {
  useEffect(() => {
    sources.set(source, items);
    changed();
  });
  useEffect(() => {
    const leave = () => {
      sources.delete(source);
      changed();
    };
    return leave;
  }, [source]);
}

export const useActionQueue = (): readonly ActionItem[] => useSyncExternalStore(subscribe, () => queue);
// Another sheet waits while the action sheet is busy: one sheet at a time (docs/122).
export const useActionsWaiting = (): boolean => useSyncExternalStore(subscribe, () => queue.length > 0);

// The block at the bottom opens the sheet of its kind: «Javob berish», «Takliflarni koʻrish», the
// red dot of the chat (docs/164); first: the thing it names comes first.
export function openSheet(kind: ActionKind, first: string | null = null): void {
  opening = { kind, first };
  changed();
}

// A bot link names one thing (?sheet=<id>): the main screen opens with its sheet (docs/122).
export function pinFirst(id: string): void {
  opening = { kind: null, first: id };
  changed();
}

// An answer: this thing leaves for good, the next of its kind comes (docs/122).
export function answeredSheet(key: string): void {
  answered.add(key);
  changed();
}

// «Keyinroq» or a tap beside: the sheet closes, the thing stays in the block (docs/164).
export function closeSheet(): void {
  opening = null;
  changed();
}

// Tests start from a clean session.
export function forgetSheets(): void {
  answered.clear();
  opening = null;
  changed();
}
