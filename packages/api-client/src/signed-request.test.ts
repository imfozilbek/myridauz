import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { RETRY_DELAY_MS } from './network';
import { signedRequest } from './signed-request';

const BASE_URL = 'https://api.test';
const offline = () => Promise.reject(new TypeError('Failed to fetch'));
const never = (_input: string, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) =>
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
  );

function client(fetch: (input: string, init?: RequestInit) => Promise<Response>, timeoutMs?: number) {
  const onError = vi.fn();
  const fetchSpy = vi.fn(fetch);
  const api = signedRequest({
    baseUrl: BASE_URL,
    fetch: fetchSpy,
    app: 'passenger',
    initData: 'signed',
    onError,
    ...(timeoutMs ? { timeoutMs } : {}),
  });
  return { api, onError, fetchSpy };
}

describe('signedRequest on a bad network (G43)', () => {
  it('reads again once when the network failed on a read', async () => {
    const { api, fetchSpy } = client(
      vi
        .fn()
        .mockImplementationOnce(offline)
        .mockResolvedValueOnce(Response.json({ ok: true })),
    );
    await expect((await api.request('/me')).json()).resolves.toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('reads again only after a pause: a page that is leaving never asks again', async () => {
    vi.useFakeTimers();
    const { api, fetchSpy } = client(
      vi
        .fn()
        .mockImplementationOnce(offline)
        .mockResolvedValueOnce(Response.json({ ok: true })),
    );
    const answer = api.request('/me');
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS - 1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect((await answer).json()).resolves.toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('never repeats a change: a lost answer may have been saved', async () => {
    const { api, fetchSpy, onError } = client(offline);
    await expect(api.post('/trips', {})).rejects.toEqual(new ApiError(0, 'network.failed'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('network.failed');
  });

  it('gives up a read that hangs and says so', async () => {
    const { api, fetchSpy, onError } = client(never, 5);
    await expect(api.request('/me')).rejects.toEqual(new ApiError(0, 'network.timeout'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith('network.timeout');
  });

  it('keeps the error code of the API when the network works', async () => {
    const { api, fetchSpy } = client(async () => Response.json({ error: 'auth.expired' }, { status: 401 }));
    await expect(api.request('/me')).rejects.toEqual(new ApiError(401, 'auth.expired'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
