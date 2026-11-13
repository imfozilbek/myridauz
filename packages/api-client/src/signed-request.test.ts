import { describe, expect, it, vi } from 'vitest';
import { quietly } from './activity';
import { ApiError } from './api-error';
import { RETRY_DELAY_MS } from './network';
import { requestOf } from './request-path';
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
    expect(onError).toHaveBeenCalledWith('network.failed', 'trips');
  });

  it('gives up a read that hangs and says so', async () => {
    const { api, fetchSpy, onError } = client(never, 5);
    await expect(api.request('/me')).rejects.toEqual(new ApiError(0, 'network.timeout'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith('network.timeout', 'me');
  });

  it('keeps the error code of the API when the network works', async () => {
    const { api, fetchSpy } = client(async () => Response.json({ error: 'auth.expired' }, { status: 401 }));
    await expect(api.request('/me')).rejects.toEqual(new ApiError(401, 'auth.expired'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // G89 U11: the code of the answer of the team that did not reach the person reaches the screen.
  it('keeps the codes of the support answer and of the cap of requests', async () => {
    const answer = (error: string, status: number) => async () => Response.json({ error }, { status });
    await expect(client(answer('support.not_sent', 502)).api.post('/x', {})).rejects.toEqual(
      new ApiError(502, 'support.not_sent'),
    );
    await expect(client(answer('rate.limited', 429)).api.post('/x', {})).rejects.toEqual(
      new ApiError(429, 'rate.limited'),
    );
  });
});

// Prod 13.11.2026: 242 «no network» a week on «Boshqaruv» came from refreshes nobody waited for.
describe('the error the analytics hears (docs/233 №5)', () => {
  it('names the request without its ids', async () => {
    const { api, onError } = client(async () => Response.json({ error: 'trips.not_found' }, { status: 404 }));
    await expect(api.request('/team/person/u_9f3a?tab=1')).rejects.toBeInstanceOf(ApiError);
    expect(onError).toHaveBeenCalledWith('trips.not_found', 'team/person/:id');
    expect(requestOf('/market/trips/123/bookings')).toBe('market/trips/:id/bookings');
  });

  it('keeps quiet about a refresh nobody waited for that met no network', async () => {
    const { api, onError } = client(offline);
    await expect(quietly(() => api.post('/trips', {}))).rejects.toBeInstanceOf(ApiError);
    expect(onError).not.toHaveBeenCalled();
  });

  it('still counts an error answer of a quiet refresh', async () => {
    const { api, onError } = client(async () => Response.json({ error: 'trips.not_found' }, { status: 500 }));
    await expect(quietly(() => api.request('/me'))).rejects.toBeInstanceOf(ApiError);
    expect(onError).toHaveBeenCalledWith('trips.not_found', 'me');
  });
});
