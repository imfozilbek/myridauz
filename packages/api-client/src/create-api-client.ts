import { HEALTH_PATH, healthResponseSchema, type HealthResponse } from '@platform/contracts';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';

type ApiClientOptions = {
  readonly baseUrl: string;
  readonly fetch: Fetch;
};

export function createApiClient({ baseUrl, fetch }: ApiClientOptions) {
  return {
    async getHealth(): Promise<HealthResponse> {
      const response = await fetch(new URL(HEALTH_PATH, baseUrl).toString());
      if (!response.ok) throw new ApiError(response.status);
      return healthResponseSchema.parse(await response.json());
    },
  };
}
