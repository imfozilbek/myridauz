import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const FULL = 100;

type Progress = { readonly value: number | null; readonly set: (value: number | null) => void };
const StepProgressContext = createContext<Progress>({ value: null, set: () => undefined });

// How much of a multi-step form is filled: the form tells its step, StepLayout draws the bar (docs/88 L4).
export function StepProgressProvider({ children }: { readonly children: ReactNode }) {
  const [value, set] = useState<number | null>(null);
  const progress = useMemo(() => ({ value, set }), [value]);
  return <StepProgressContext.Provider value={progress}>{children}</StepProgressContext.Provider>;
}

// A form at step `at` of `of` (from 0); a step outside the list shows no bar.
export function useStepProgress(at: number, of: number) {
  const { set } = useContext(StepProgressContext);
  useEffect(() => {
    set(at < 0 ? null : Math.round(((at + 1) / of) * FULL));
    return () => set(null);
  }, [at, of, set]);
}

export const useStepProgressValue = () => useContext(StepProgressContext).value;
