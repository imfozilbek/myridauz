import { useEffect, useState } from 'react';

const STEP_MS = 30 * 1000;

// The time of a page moves on by itself: «Joʻnashga N daqiqa» and the main button follow it.
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), STEP_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}
