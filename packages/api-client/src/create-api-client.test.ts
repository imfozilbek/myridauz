import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';
import { createApiClient } from './create-api-client';

const BASE_URL = 'https://api.test';
const clientReturning = (response: Response) =>
  createApiClient({ baseUrl: BASE_URL, fetch: async () => response });

describe('createApiClient', () => {
  it('reads health', async () => {
    const body = { status: 'ok', time: '2026-09-28T10:00:00.000Z' };
    await expect(clientReturning(Response.json(body)).getHealth()).resolves.toEqual(body);
  });

  it('calls the health path', async () => {
    const calls: string[] = [];
    const client = createApiClient({
      baseUrl: BASE_URL,
      fetch: async (input) => {
        calls.push(input);
        return Response.json({ status: 'ok', time: '2026-09-28T10:00:00.000Z' });
      },
    });
    await client.getHealth();
    expect(calls).toEqual([`${BASE_URL}/health`]);
  });

  it('throws an error with the HTTP status', async () => {
    const failing = clientReturning(new Response(null, { status: 503 }));
    await expect(failing.getHealth()).rejects.toEqual(new ApiError(503));
  });

  it('rejects a response that breaks the contract', async () => {
    await expect(clientReturning(Response.json({ status: 'down' })).getHealth()).rejects.toThrow();
  });
});
