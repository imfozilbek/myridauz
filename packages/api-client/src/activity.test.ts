import { afterEach, describe, expect, it, vi } from 'vitest';
import { activity, quietly } from './activity';
import { fetchOnce } from './network';

const answered = () => {
  let answer: (response: Response) => void = () => undefined;
  const fetch = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
  );
  return { fetch, answer: () => answer(new Response('{}')) };
};
const seen: number[] = [];
activity.subscribe((busy) => seen.push(busy));

afterEach(() => {
  seen.length = 0;
});

// One counter of the requests people wait for: the top loader of every Mini App reads it (docs/121 §3, G72).
describe('activity of the API (G72)', () => {
  it('counts a request from its start to its answer', async () => {
    const { fetch, answer } = answered();
    const done = fetchOnce(fetch, 'https://api.test/x', {}, 1000);
    expect(activity.busy()).toBe(1);
    answer();
    await done;
    expect(activity.busy()).toBe(0);
    expect(seen).toEqual([1, 0]);
  });

  it('does not count the quiet work: a refresh of the data the screen already shows', async () => {
    const { fetch, answer } = answered();
    const done = quietly(() => fetchOnce(fetch, 'https://api.test/x', {}, 1000));
    expect(activity.busy()).toBe(0);
    answer();
    await done;
    expect(seen).toEqual([]);
  });

  it('counts a failed request out again', async () => {
    const fetch = vi.fn(() => Promise.reject(new TypeError('offline')));
    await fetchOnce(fetch, 'https://api.test/x', { method: 'POST' }, 1000).catch(() => undefined);
    expect(activity.busy()).toBe(0);
    expect(seen).toEqual([1, 0]);
  });
});
