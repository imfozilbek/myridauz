import { apiErrorSchema, authHeaders, type MiniApp } from '@platform/contracts';
import { isQuiet } from './activity';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { fetchOnce, REQUEST_TIMEOUT_MS } from './network';
import { requestOf } from './request-path';

export type SignedOptions = {
  readonly baseUrl: string;
  readonly fetch: Fetch;
  readonly app: MiniApp;
  // Signed Telegram launch data of this Mini App: the only "login" (docs/32).
  readonly initData: string;
  // Every error answer goes to the analytics as api_error with the address of the request (G12,
  // docs/29, docs/233 №5).
  readonly onError?: (code: string, request: string) => void;
  readonly timeoutMs?: number;
};

const JSON_HEADERS = { 'content-type': 'application/json' };

// Every call carries the Telegram signature; an error becomes an ApiError with the code of the API.
export function signedRequest(options: SignedOptions) {
  const { baseUrl, fetch, app, initData, onError, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const base = `${baseUrl.replace(/\/$/, '')}/`;
  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = { ...authHeaders(app, initData), ...(init.headers as Record<string, string>) };
    const url = new URL(path.slice(1), base).toString();
    const where = requestOf(path);
    // A quiet refresh nobody waits for (the return to the app, a signal) that met no network is not an
    // error people saw: iOS wakes the app before its network (242 a week on «Boshqaruv», 13.11.2026).
    const seen = !isQuiet();
    const response = await fetchOnce(fetch, url, { ...init, headers }, timeoutMs).catch((error: ApiError) => {
      if (seen) onError?.(error.message, where);
      throw error;
    });
    if (response.ok) return response;
    const body = apiErrorSchema.safeParse(await response.json().catch(() => null));
    const error = new ApiError(response.status, body.success ? body.data.error : undefined);
    onError?.(error.message, where);
    throw error;
  }
  return {
    request,
    post: (path: string, body: unknown) =>
      request(path, { method: 'POST', body: JSON.stringify(body), headers: JSON_HEADERS }),
    putJson: (path: string, body: unknown) =>
      request(path, { method: 'PUT', body: JSON.stringify(body), headers: JSON_HEADERS }),
    put: (path: string, image: Blob) =>
      request(path, { method: 'PUT', body: image, headers: { 'content-type': image.type } }),
  };
}
