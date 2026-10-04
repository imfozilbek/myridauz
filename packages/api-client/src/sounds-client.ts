import {
  ADMIN_SOUNDS_PATH,
  PUBLIC_SOUNDS_PATH,
  soundChoiceSchema,
  soundsStateSchema,
  type SoundChoice,
  type SoundsState,
} from '@platform/contracts';
import { ApiError } from './api-error';
import { signedRequest, type SignedOptions } from './signed-request';

// The sounds of the brand (G54, docs/115): every Mini App reads the set in use without a signature,
// the team opens the admin screen and the owner picks a set, signed.
export function createSoundsClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const publicUrl = new URL(PUBLIC_SOUNDS_PATH.slice(1), `${options.baseUrl.replace(/\/$/, '')}/`).toString();
  const state = async (response: Response) => soundsStateSchema.parse(await response.json());
  return {
    current: async (): Promise<SoundChoice> => {
      const response = await options.fetch(publicUrl);
      if (!response.ok) throw new ApiError(response.status);
      return soundChoiceSchema.parse(await response.json());
    },
    state: async (): Promise<SoundsState> => state(await request(ADMIN_SOUNDS_PATH)),
    pick: async (set: string): Promise<SoundsState> => state(await post(ADMIN_SOUNDS_PATH, { set })),
  };
}

export type SoundsClient = ReturnType<typeof createSoundsClient>;
