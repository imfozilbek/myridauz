import { useEffect, useSyncExternalStore } from 'react';

// How many sheets stand over the screen now: the main button hides under them, else the native
// button of Telegram covers the buttons of the sheet (mockups g60/6, g60/7).
let shown = 0;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

// A sheet tells it is open for as long as it is.
export function useSheetShown(open: boolean): void {
  useEffect(() => {
    if (!open) return undefined;
    shown += 1;
    changed();
    return () => {
      shown -= 1;
      changed();
    };
  }, [open]);
}

export const useAnySheet = (): boolean => useSyncExternalStore(subscribe, () => shown > 0);
