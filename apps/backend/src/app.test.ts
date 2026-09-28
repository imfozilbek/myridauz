import { appHost, loadBrand } from '@platform/brands';
import { createAnalyticsClient, createApiClient } from '@platform/api-client';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { localAnalyticsRows } from './modules/analytics';

// Contract test: the real client reads the real backend through the shared schema.
const fetchApp = async (input: string, init?: RequestInit) => app.request(input, init);
const client = createApiClient({ baseUrl: 'https://api.test', fetch: fetchApp });

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

  it('accepts analytics from the real client and keeps it locally', async () => {
    const context = {
      app: 'passenger',
      sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
      version: '0.1.0',
    } as const;
    const analytics = createAnalyticsClient({ baseUrl: 'https://api.test', fetch: fetchApp, context });
    analytics.track({ name: 'screen_open', screen: 'welcome' });
    await analytics.flush();
    expect(localAnalyticsRows.at(-1)?.blobs.slice(0, 3)).toEqual(['screen_open', 'passenger', 'welcome']);
  });

  it('lets only the brand Mini Apps call the API from a browser', async () => {
    const preflight = (origin: string) =>
      app.request('/analytics', {
        method: 'OPTIONS',
        headers: { origin, 'access-control-request-method': 'POST' },
      });
    const passenger = `https://${appHost(loadBrand(), 'passenger')}`;
    const allowed = await preflight(passenger);
    expect(allowed.headers.get('access-control-allow-origin')).toBe(passenger);
    const other = await preflight('https://evil.example');
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});
