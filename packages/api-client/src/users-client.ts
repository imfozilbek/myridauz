import {
  apiErrorSchema,
  authHeaders,
  ME_PATH,
  meResponseSchema,
  MY_AVATAR_PATH,
  REGISTRATION_PATH,
  userAvatarPath,
  WRITE_ACCESS_PATH,
  type MeResponse,
  type MiniApp,
  type RegistrationInput,
} from '@platform/contracts';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';

type UsersClientOptions = {
  readonly baseUrl: string;
  readonly fetch: Fetch;
  readonly app: MiniApp;
  // Signed Telegram launch data of this Mini App: the only "login" (docs/32).
  readonly initData: string;
};

const JSON_HEADERS = { 'content-type': 'application/json' };

export function createUsersClient({ baseUrl, fetch, app, initData }: UsersClientOptions) {
  const base = `${baseUrl.replace(/\/$/, '')}/`;
  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = { ...authHeaders(app, initData), ...(init.headers as Record<string, string>) };
    const response = await fetch(new URL(path.slice(1), base).toString(), { ...init, headers });
    if (response.ok) return response;
    const body = apiErrorSchema.safeParse(await response.json().catch(() => null));
    throw new ApiError(response.status, body.success ? body.data.error : undefined);
  }
  const post = (path: string, body: unknown) =>
    request(path, { method: 'POST', body: JSON.stringify(body), headers: JSON_HEADERS });

  return {
    async getMe(): Promise<MeResponse> {
      return meResponseSchema.parse(await (await request(ME_PATH)).json());
    },
    async register(input: RegistrationInput): Promise<MeResponse> {
      return meResponseSchema.parse(await (await post(REGISTRATION_PATH, input)).json());
    },
    async uploadAvatar(image: Blob): Promise<void> {
      await request(MY_AVATAR_PATH, { method: 'PUT', body: image, headers: { 'content-type': image.type } });
    },
    async setWriteAccess(allowed: boolean): Promise<void> {
      await post(WRITE_ACCESS_PATH, { allowed });
    },
    // The photo needs the Telegram signature, so it is loaded as a blob, not by an <img> link.
    async getAvatar(userId: number): Promise<Blob> {
      return (await request(userAvatarPath(userId))).blob();
    },
  };
}

export type UsersClient = ReturnType<typeof createUsersClient>;
