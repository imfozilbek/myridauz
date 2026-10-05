import { describe, expect, it } from 'vitest';
import type { DataPoint } from '../domain/data-point';
import { analyticsRoutes } from './analytics-routes';

const event = {
  name: 'screen_open',
  app: 'passenger',
  screen: 'home',
  at: 1,
  sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
  version: '0.1.0',
};

function post(body: string) {
  const written: DataPoint[] = [];
  const routes = analyticsRoutes(
    () => ({ write: (point) => written.push(point) }),
    () => 5,
  );
  const request = routes.request('/analytics', {
    method: 'POST',
    body,
    // As the client sends it: plain text, no preflight (G56).
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
  });
  return { request, written };
}

describe('POST /analytics', () => {
  it('records a valid batch', async () => {
    const { request, written } = post(JSON.stringify({ events: [event] }));
    expect((await request).status).toBe(204);
    expect(written[0]?.doubles).toEqual([1, 5]);
  });

  it('rejects an invalid batch with an error code', async () => {
    const response = await post(JSON.stringify({ events: [{ ...event, screen: 'Free text' }] })).request;
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'analytics.invalid_batch' });
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('not json').request).status).toBe(400);
  });
});
