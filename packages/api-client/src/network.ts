import { ApiError } from './api-error';
import type { Fetch } from './fetch';

// A slow 3G answers in seconds; a request that hangs longer is given up, so the screen is never
// stuck on a spinner (G43, docs/81 F02).
export const REQUEST_TIMEOUT_MS = 15_000;
const READ = 'GET';
// The second read waits a moment: a page that is leaving drops its requests, and its timers never
// run, so a dropped read is never asked again from a page that is gone (lesson 134).
export const RETRY_DELAY_MS = 1000;
const pause = () => new Promise((resume) => setTimeout(resume, RETRY_DELAY_MS));

// A read is asked once more after a lost answer: nothing changes on the server. A change is never
// repeated: its lost answer may hide a change that was saved.
export async function fetchOnce(fetch: Fetch, url: string, init: RequestInit, timeoutMs: number) {
  const tries = (init.method ?? READ) === READ ? 2 : 1;
  for (let left = tries; ; left -= 1) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      if (left <= 1) throw lostAnswer(error);
    }
    await pause();
  }
}

const lostAnswer = (error: unknown) =>
  new ApiError(
    0,
    error instanceof DOMException && error.name === 'TimeoutError' ? 'network.timeout' : 'network.failed',
  );
