import { describe, expect, it } from 'vitest';
import { analyticsBatchSchema, MAX_ANALYTICS_BATCH } from './analytics';

const event = {
  name: 'screen_open',
  app: 'passenger',
  screen: 'home',
  at: 1_790_000_000_000,
  sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
  version: '0.1.0',
};

describe('analyticsBatchSchema', () => {
  it('accepts a valid batch', () => {
    expect(analyticsBatchSchema.parse({ events: [event] }).events).toHaveLength(1);
  });

  it('rejects free text in screen ids', () => {
    expect(analyticsBatchSchema.safeParse({ events: [{ ...event, screen: 'Ali +998 90' }] }).success).toBe(
      false,
    );
  });

  it('requires a code for client errors', () => {
    const error = { ...event, name: 'client_error' };
    expect(analyticsBatchSchema.safeParse({ events: [error] }).success).toBe(false);
    expect(analyticsBatchSchema.safeParse({ events: [{ ...error, code: 'render' }] }).success).toBe(true);
  });

  it('limits the batch size', () => {
    const events = Array.from({ length: MAX_ANALYTICS_BATCH + 1 }, () => event);
    expect(analyticsBatchSchema.safeParse({ events }).success).toBe(false);
    expect(analyticsBatchSchema.safeParse({ events: [] }).success).toBe(false);
  });
});
