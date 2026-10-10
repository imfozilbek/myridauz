import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

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

// The block at the bottom of the main screen stays under a sheet, dimmed with the screen (G76,
// mockup g76/4, lesson 199); only its buttons of Telegram step aside, else they cover the sheet.
export const UnderSheets = createContext(false);

export function useUnderSheet(): boolean {
  const under = useContext(UnderSheets);
  const any = useAnySheet();
  return under && any;
}
