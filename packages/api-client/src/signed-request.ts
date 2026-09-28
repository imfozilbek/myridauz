import { apiErrorSchema, authHeaders, type MiniApp } from '@platform/contracts';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';

export type SignedOptions = {
  readonly baseUrl: string;
  readonly fetch: Fetch;
  readonly app: MiniApp;
  // Signed Telegram launch data of this Mini App: the only "login" (docs/32).
  readonly initData: string;
};

const JSON_HEADERS = { 'content-type': 'application/json' };

// Every call carries the Telegram signature; an error becomes an ApiError with the code of the API.
export function signedRequest({ baseUrl, fetch, app, initData }: SignedOptions) {
  const base = `${baseUrl.replace(/\/$/, '')}/`;
  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = { ...authHeaders(app, initData), ...(init.headers as Record<string, string>) };
    const response = await fetch(new URL(path.slice(1), base).toString(), { ...init, headers });
    if (response.ok) return response;
    const body = apiErrorSchema.safeParse(await response.json().catch(() => null));
    throw new ApiError(response.status, body.success ? body.data.error : undefined);
  }
  return {
    request,
    post: (path: string, body: unknown) =>
      request(path, { method: 'POST', body: JSON.stringify(body), headers: JSON_HEADERS }),
    put: (path: string, image: Blob) =>
      request(path, { method: 'PUT', body: image, headers: { 'content-type': image.type } }),
  };
}
