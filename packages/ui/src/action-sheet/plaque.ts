import { useSyncExternalStore } from 'react';

// The short plaque on top that says what was done (mockup g68/7 screen 4): an answer of the sheet,
// a sent complaint (G78 П16). It stays over the screen that comes next; the sheet shows it.
let text: string | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export function showPlaque(next: string | null) {
  text = next;
  listeners.forEach((listener) => listener());
}

export const usePlaque = () => useSyncExternalStore(subscribe, () => text);
