import { createApiClient } from '@platform/api-client';
import { describe, expect, it } from 'vitest';
import { app } from './app';

// Contract test: the real client reads the real backend through the shared schema.
const client = createApiClient({
  baseUrl: 'https://api.test',
  fetch: async (input, init) => app.request(input, init),
});

describe('backend contract', () => {
  it('answers health in the shared format', async () => {
    const health = await client.getHealth();
    expect(health.status).toBe('ok');
    expect(Date.parse(health.time)).not.toBeNaN();
  });

  it('answers 404 for an unknown path', async () => {
    const response = await app.request('/unknown');
    expect(response.status).toBe(404);
  });
});
