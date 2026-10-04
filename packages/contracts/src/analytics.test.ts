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

  it('keeps what broke a screen, never free text of a person (G52, docs/112)', () => {
    const crash = {
      ...event,
      name: 'client_error',
      code: 'render',
      error: 'TypeError',
      client: 'android 8.0',
    };
    const ok = (detail: string) => analyticsBatchSchema.safeParse({ events: [{ ...crash, detail }] }).success;
    expect(ok("Cannot read properties of undefined (reading 'lat')")).toBe(true);
    expect(ok('phone #')).toBe(true);
    expect(ok('+998 90 123 45 67')).toBe(false);
    expect(ok('Алишер')).toBe(false);
    expect(ok('x'.repeat(121))).toBe(false);
    const client = (value: string) =>
      analyticsBatchSchema.safeParse({ events: [{ ...crash, client: value }] }).success;
    expect(client('tdesktop 7.10')).toBe(true);
    expect(client('android 9.6 chrome 83')).toBe(true);
    expect(client('Ali Valiyev')).toBe(false);
  });

  it('limits the batch size', () => {
    const events = Array.from({ length: MAX_ANALYTICS_BATCH + 1 }, () => event);
    expect(analyticsBatchSchema.safeParse({ events }).success).toBe(false);
    expect(analyticsBatchSchema.safeParse({ events: [] }).success).toBe(false);
  });

  it('drops personal fields and refuses free text in codes (G12, docs/29)', () => {
    const extra = { ...event, phone: '+998901234567', name: 'screen_open', firstName: 'Ali' };
    const [parsed] = analyticsBatchSchema.parse({ events: [extra] }).events;
    expect(JSON.stringify(parsed)).not.toMatch(/998|Ali/);
    const apiError = { ...event, name: 'api_error' };
    expect(analyticsBatchSchema.safeParse({ events: [{ ...apiError, code: 'users.blocked' }] }).success).toBe(
      true,
    );
    expect(analyticsBatchSchema.safeParse({ events: [{ ...apiError, code: 'Ali Valiyev' }] }).success).toBe(
      false,
    );
  });
});
