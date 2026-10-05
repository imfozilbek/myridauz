import { apiErrorSchema, authHeaders, type MiniApp } from '@platform/contracts';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { fetchOnce, REQUEST_TIMEOUT_MS } from './network';

export type SignedOptions = {
  readonly baseUrl: string;
  readonly fetch: Fetch;
  readonly app: MiniApp;
  // Signed Telegram launch data of this Mini App: the only "login" (docs/32).
  readonly initData: string;
  // Every error answer goes to the analytics as api_error (G12, docs/29).
  readonly onError?: (code: string) => void;
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
    const response = await fetchOnce(fetch, url, { ...init, headers }, timeoutMs).catch((error: ApiError) => {
      onError?.(error.message);
      throw error;
    });
    if (response.ok) return response;
    const body = apiErrorSchema.safeParse(await response.json().catch(() => null));
    const error = new ApiError(response.status, body.success ? body.data.error : undefined);
    onError?.(error.message);
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
