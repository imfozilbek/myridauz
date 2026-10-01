import type { KeyboardEvent } from 'react';

// A row that opens something is a button for TalkBack and the keyboard too: Enter and Space press it.
export const PRESSABLE = {
  role: 'button',
  tabIndex: 0,
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  },
} as const;
