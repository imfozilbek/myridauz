import {
  ADMIN_LIMITS_PATH,
  adminLimitPath,
  limitsSchema,
  ownerLimitsSchema,
  PUBLIC_LIMITS_PATH,
  type LimitKey,
  type Limits,
  type OwnerLimits,
} from '@platform/contracts';
import { ApiError } from './api-error';
import { fetchOnce, REQUEST_TIMEOUT_MS } from './network';
import { signedRequest, type SignedOptions } from './signed-request';

// «Cheklovlar» (G75, docs/128 §4): every Mini App reads the owner's values without a signature and puts
// them over its brand config; the owner reads all limits with their history and changes one, signed.
export function createLimitsClient(options: SignedOptions) {
  const { request, putJson } = signedRequest(options);
  const publicUrl = new URL(PUBLIC_LIMITS_PATH.slice(1), `${options.baseUrl.replace(/\/$/, '')}/`).toString();
  const state = async (response: Response) => limitsSchema.parse(await response.json());
  return {
    current: async (): Promise<OwnerLimits> => {
      const response = await fetchOnce(options.fetch, publicUrl, {}, REQUEST_TIMEOUT_MS);
      if (!response.ok) throw new ApiError(response.status);
      return ownerLimitsSchema.parse(await response.json());
    },
    state: async (): Promise<Limits> => state(await request(ADMIN_LIMITS_PATH)),
    change: async (key: LimitKey, value: number): Promise<Limits> =>
      state(await putJson(adminLimitPath(key), { value })),
  };
}

export type LimitsClient = ReturnType<typeof createLimitsClient>;
