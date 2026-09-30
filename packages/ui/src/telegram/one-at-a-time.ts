import { useCallback, useRef, useState } from 'react';

// A second tap while the first action runs does nothing: no second trip, booking or payment.
export function useOneAtATime(onClick: () => unknown) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = useCallback(() => {
    if (running.current) return;
    const result = onClick();
    if (!(result instanceof Promise)) return;
    running.current = true;
    setBusy(true);
    void result.finally(() => {
      running.current = false;
      setBusy(false);
    });
  }, [onClick]);
  return { busy, run };
}
