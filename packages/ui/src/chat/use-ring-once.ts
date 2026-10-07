import { useEffect, useRef } from 'react';

// Rings once when it may: a back and forth of the chat never calls again by itself (G60).
export function useRingOnce(may: boolean, ring: () => Promise<void>) {
  const rang = useRef(false);
  useEffect(() => {
    if (!may || rang.current) return;
    rang.current = true;
    void ring();
  }, [may, ring]);
}
