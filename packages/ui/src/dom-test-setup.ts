import { configure } from '@testing-library/react';
import { afterAll, beforeEach, vi } from 'vitest';
import { forgetSheets } from './action-sheet/action-queue';
import { forgetAllLists } from './screen/list-memory';

// The first screen of a test file loads TelegramUI; in the full run with coverage on a busy
// CI machine this can take longer than the default 1 s of findBy*, so waits get 5 s.
const ASYNC_WAIT_MS = 5000;
configure({ asyncUtilTimeout: ASYNC_WAIT_MS });

// The trips and bookings of the tests are set for 1 and 2 October 2026: every test starts at the same
// afternoon in Toshkent, so a fixture never becomes "the past" by itself (lesson №75). The clock runs.
const TEST_NOW = Date.parse('2026-10-01T12:00:00Z');
beforeEach(() => {
  forgetAllLists();
  forgetSheets();
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(TEST_NOW);
});

// jsdom has no scrolling: a screen that opens at the top calls a no-op here.
if (typeof window !== 'undefined') window.scrollTo = () => undefined;

// A sheet of vaul sets React state on its timers (the longest is 500 ms), also after the test left the
// page; a timer that outlives the file breaks the run: «window is not defined» (lessons 194, 203, 235,
// 244, 270). A file that opened a sheet waits for them once at the end.
const SHEET_TIMERS_MS = 600;
let sheetOpened = false;
if (typeof document !== 'undefined') {
  new MutationObserver(() => {
    sheetOpened ||= document.querySelector('[vaul-drawer]') !== null;
  }).observe(document.body, { childList: true, subtree: true });
}
afterAll(async () => {
  if (!sheetOpened) return;
  vi.useRealTimers();
  await new Promise((done) => setTimeout(done, SHEET_TIMERS_MS));
});
