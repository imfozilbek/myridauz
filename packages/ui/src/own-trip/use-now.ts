import { useCallback, useEffect, useState } from 'react';

const STEP_MS = 30 * 1000;

// The time of a page moves on by itself: «Joʻnashga N daqiqa» and the main button follow it. tick: the
// page catches up at once, at the tap that sends a time (G77).
export function useClock(): readonly [number, () => void] {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), STEP_MS);
    return () => clearInterval(timer);
  }, []);
  const tick = useCallback(() => setNow(Date.now()), []);
  return [now, tick];
}

export const useNow = (): number => useClock()[0];
