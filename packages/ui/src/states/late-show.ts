import { useEffect, useState } from 'react';

// A skeleton shows only when the wait is long enough to see (G41, docs/108): an answer faster than
// this never blinks gray. The place of the skeleton is kept from the start, so nothing jumps.
const SKELETON_DELAY_MS = 250;

export function useLateShow(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), SKELETON_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  return shown;
}

// The attributes of a late skeleton: busy for screen readers and tests, hidden until it is due.
export const lateProps = (shown: boolean) => ({
  'aria-busy': true,
  className: 'skeleton-late',
  ...(shown ? {} : { 'data-hidden': '' }),
});
