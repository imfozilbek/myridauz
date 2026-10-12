import { act, fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

// A sheet closes on a 300 ms timer of vaul that sets React state, also after it left the page: the
// test waits for both, or the timer outlives the file: «window is not defined» (lessons 194, 203).
const DRAWER_TIMER_MS = 350;
export const sheetClosed = async () => {
  await waitFor(() => expect(document.querySelector('[vaul-drawer]')).toBeNull());
  await act(() => new Promise((done) => setTimeout(done, DRAWER_TIMER_MS)));
};

// The shade or a swipe closes a sheet outside Telegram; in a test Escape does the same.
export const closeSheet = async () => {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
  await sheetClosed();
};
