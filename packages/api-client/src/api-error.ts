import type { ApiErrorCode } from '@platform/contracts';

// The answer never came: no network, or it took too long (G43). The phone knows it, not the API.
export type NetworkErrorCode = 'network.failed' | 'network.timeout';

// Errors carry a code, never a text for people (docs/13). Status 0: no answer from the API.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: ApiErrorCode | NetworkErrorCode,
  ) {
    super(code ?? `api.http_${status}`);
  }
}
