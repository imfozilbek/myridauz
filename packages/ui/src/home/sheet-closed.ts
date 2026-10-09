import { act, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

// A sheet closes on a 300 ms timer of vaul that sets React state, also after it left the page: the
// test waits for both, or the timer outlives the file: «window is not defined» (lessons 194, 203).
const DRAWER_TIMER_MS = 350;
export const sheetClosed = async () => {
  await waitFor(() => expect(document.querySelector('[vaul-drawer]')).toBeNull());
  await act(() => new Promise((done) => setTimeout(done, DRAWER_TIMER_MS)));
};
