import { useEffect, useSyncExternalStore } from 'react';
import { ACTION_ORDER, idOf, type ActionItem } from './action-item';

// The things that ask the person for an action, by who brought them: the main screen of a role, a
// ringing call (docs/122). One sheet shows them one at a time, in ACTION_ORDER.
const sources = new Map<string, readonly ActionItem[]>();
// Put aside in this session: «Keyinroq», or answered while fresh data is on its way.
const aside = new Set<string>();
const listeners = new Set<() => void>();
// The id a bot link named: its sheet comes first of its kind (docs/122).
let pinned: string | null = null;
let queue: readonly ActionItem[] = [];

const rank = (item: ActionItem) =>
  ACTION_ORDER.indexOf(item.kind) * 2 + (pinned !== null && idOf(item.key) === pinned ? 0 : 1);

function changed() {
  const all = [...sources.values()].flat().filter((item) => !aside.has(item.key));
  queue = [...all].sort((a, b) => rank(a) - rank(b));
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

// «Keyinroq», or an answer given: the thing leaves the sheet; it stays on its tile (docs/122).
export function putAside(key: string): void {
  aside.add(key);
  changed();
}

export function pinFirst(id: string): void {
  pinned = id;
  changed();
}
