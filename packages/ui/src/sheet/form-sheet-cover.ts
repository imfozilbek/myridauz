import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

// How many form sheets stand over the screen now (G75, mockup g75/3 A): the button of the screen
// under a sheet steps aside, the button inside the sheet does the step.
let open = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
const changed = () => listeners.forEach((listener) => listener());

export function useFormSheetOpen(shown: boolean): void {
  useEffect(() => {
    if (!shown) return undefined;
    open += 1;
    changed();
    return () => {
      open -= 1;
      changed();
    };
  }, [shown]);
}

// true inside a form sheet: its own button is never covered.
export const InFormSheet = createContext(false);

// The button of a screen under an open form sheet hides.
export function useCoveredBySheet(): boolean {
  const inside = useContext(InFormSheet);
  const any = useSyncExternalStore(subscribe, () => open > 0);
  return any && !inside;
}
