import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import type { AppEnv } from './env';
import { localAnalyticsRows } from './modules/analytics';
import { notFound, onServerError } from './shared/http/errors';

// Every answer of the API is {error} with a code, never a plain text page (G42, docs/111).
describe('errors of the API', () => {
  it('answers an unknown path with a code', async () => {
    const response = await app.request('/unknown');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });

  it('answers a broken route with a code and counts it in the analytics', async () => {
    const broken = new Hono<AppEnv>()
      .get('/boom', () => {
        throw new Error('D1 is down');
      })
      .onError(onServerError)
      .notFound(notFound);
    const response = await broken.request('/boom');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'server.error' });
    expect(localAnalyticsRows.at(-1)?.blobs.slice(0, 2)).toEqual(['server_error', 'server']);
  });
});
