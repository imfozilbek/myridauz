import { useEffect } from 'react';
import { forgetList } from '../screen/list-memory';

// A list screen that closes forgets its memory (docs/94 F2). It runs after the rows wrote down their
// place, so the next visit opens fresh at the top; a row opened inside the screen keeps it.
export function useForgetOnLeave(key: string) {
  useEffect(() => {
    return () => forgetList(key);
  }, [key]);
}
