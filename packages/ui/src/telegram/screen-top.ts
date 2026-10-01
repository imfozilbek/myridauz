import { useEffect } from 'react';

// A screen opens at the top: its question is never left above the edge by the scroll of the last
// screen or of a long list (G27, docs/83 N21). A new key opens it at the top again.
export function useOpenAtTop(key?: unknown): void {
  useEffect(() => window.scrollTo(0, 0), [key]);
}
