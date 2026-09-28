// Errors carry a code, never a text for people (docs/13).
export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`api.http_${status}`);
  }
}
// a — b
