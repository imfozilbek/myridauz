import type { CancelWhat } from '@platform/contracts';
import { useSyncExternalStore } from 'react';

// The question «Nima uchun?» after a cancel or a deletion (G87 V3, docs/191): one sheet for the whole
// app (reason-sheet.tsx); the step that asked it goes on once it is answered or closed.
type Asked = { readonly what: CancelWhat; readonly done: () => void };

let asked: Asked | null = null;
const listeners = new Set<() => void>();
const tell = () => listeners.forEach((listener) => listener());

export function askReason(what: CancelWhat): Promise<void> {
  asked?.done();
  return new Promise((resolve) => {
    asked = { what, done: resolve };
    tell();
  });
}

export function closeReason(): void {
  const closed = asked;
  asked = null;
  tell();
  closed?.done();
}

const subscribe = (changed: () => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};

export const useAskedReason = () => useSyncExternalStore(subscribe, () => asked?.what ?? null);
