import {
  ME_PATH,
  meResponseSchema,
  MY_AVATAR_PATH,
  REGISTRATION_PATH,
  userAvatarPath,
  WRITE_ACCESS_PATH,
  type MeResponse,
  type RegistrationInput,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

export function createUsersClient(options: SignedOptions) {
  const { request, post, put } = signedRequest(options);
  return {
    async getMe(): Promise<MeResponse> {
      return meResponseSchema.parse(await (await request(ME_PATH)).json());
    },
    async register(input: RegistrationInput): Promise<MeResponse> {
      return meResponseSchema.parse(await (await post(REGISTRATION_PATH, input)).json());
    },
    async uploadAvatar(image: Blob): Promise<void> {
      await put(MY_AVATAR_PATH, image);
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
