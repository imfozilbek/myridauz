import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '../../env';
import { afterResponse } from './after-response';

afterEach(() => vi.restoreAllMocks());

function appDoing(work: () => Promise<void>) {
  return new Hono<AppEnv>().get('/trip', async (context) => {
    await afterResponse(context, work);
    return context.text('ok');
  });
}

describe('work the answer does not wait for (G63)', () => {
  it('goes to waitUntil of the Worker', async () => {
    const waited: Promise<unknown>[] = [];
    const worker = {
      waitUntil: (work: Promise<unknown>) => void waited.push(work),
      passThroughOnException: () => undefined,
      props: {},
    };
    let done = false;
    const response = await appDoing(async () => void (done = true)).request('/trip', {}, {}, worker);
    expect(await response.text()).toBe('ok');
    expect(waited).toHaveLength(1);
    await waited[0];
    expect(done).toBe(true);
  });

  it('is awaited without a Worker: tests and local runs see it at once', async () => {
    let done = false;
    await appDoing(async () => void (done = true)).request('/trip', {}, {});
    expect(done).toBe(true);
  });

  it('never breaks the answer: a failure goes to the log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await appDoing(async () => Promise.reject(new Error('D1 down'))).request(
      '/trip',
      {},
      {},
    );
    expect(response.status).toBe(200);
    expect(log.mock.calls[0]?.[0]).toContain('D1 down');
  });
});
