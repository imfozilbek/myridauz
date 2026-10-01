import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// A second tap while the first action runs does nothing: no second trip, booking or payment.
export function useOneAtATime(onClick: () => unknown) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  // The latest action, so the native button keeps one listener while the screen renders again.
  // Set right after the render, before any tap can come: a tap never runs an old action.
  const latest = useRef(onClick);
  useLayoutEffect(() => {
    latest.current = onClick;
  });
  const run = useCallback(() => {
    if (running.current) return;
    const result = latest.current();
    if (!(result instanceof Promise)) return;
    running.current = true;
    setBusy(true);
    void result.finally(() => {
      running.current = false;
      setBusy(false);
    });
  }, []);
  return { busy, run };
}
