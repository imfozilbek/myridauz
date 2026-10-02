import { useLayoutEffect, useRef } from 'react';

// A list refreshed quietly keeps the row under the finger where it was (docs/94 S3): rows carry
// data-row with their id; the first row on the screen is found again after the change.
type Anchor = { readonly row: string; readonly top: number };

function firstRowOnScreen(): Anchor | null {
  if (window.scrollY === 0) return null;
  for (const element of document.querySelectorAll<HTMLElement>('[data-row]')) {
    const { top, bottom } = element.getBoundingClientRect();
    if (bottom > 0) return { row: element.dataset['row'] ?? '', top };
  }
  return null;
}

export function useKeepPlace(rows: unknown) {
  const last = useRef(rows);
  const anchor = useRef<Anchor | null>(null);
  // Read before React changes the screen: the render of new rows is the last moment.
  if (last.current !== rows) {
    last.current = rows;
    anchor.current = firstRowOnScreen();
  }
  useLayoutEffect(() => {
    const before = anchor.current;
    anchor.current = null;
    if (!before) return;
    const now = document.querySelector(`[data-row="${CSS.escape(before.row)}"]`);
    if (now) window.scrollBy(0, now.getBoundingClientRect().top - before.top);
  }, [rows]);
}
