import { describe, expect, it } from 'vitest';
import { MAX_ANALYTICS_BATCH } from './analytics';
import { goodEvents } from './analytics-batch';

const accepted = (events: unknown[]) => goodEvents({ events }) !== null;

const event = {
  name: 'screen_open',
  app: 'passenger',
  screen: 'home',
  at: 1_790_000_000_000,
  sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
  version: '0.1.0',
};

describe('goodEvents', () => {
  it('accepts a valid batch', () => {
    expect(goodEvents({ events: [event] })?.events).toHaveLength(1);
  });

  it('rejects free text in screen ids', () => {
    expect(accepted([{ ...event, screen: 'Ali +998 90' }])).toBe(false);
  });

  it('requires a code for client errors', () => {
    const error = { ...event, name: 'client_error' };
    expect(accepted([error])).toBe(false);
    expect(accepted([{ ...error, code: 'render' }])).toBe(true);
  });

  it('keeps what broke a screen, never free text of a person (G52, docs/112)', () => {
    const crash = {
      ...event,
      name: 'client_error',
      code: 'render',
      error: 'TypeError',
      client: 'android 8.0',
    };
    const ok = (detail: string) => accepted([{ ...crash, detail }]);
    expect(ok("Cannot read properties of undefined (reading 'lat')")).toBe(true);
    expect(ok('phone #')).toBe(true);
    expect(ok('+998 90 123 45 67')).toBe(false);
    expect(ok('Алишер')).toBe(false);
    expect(ok('x'.repeat(121))).toBe(false);
    const client = (value: string) => accepted([{ ...crash, client: value }]);
    expect(client('tdesktop 7.10')).toBe(true);
    expect(client('android 9.6 chrome 83')).toBe(true);
    expect(client('Ali Valiyev')).toBe(false);
  });

  it('keeps the good events when one is bad (G43)', () => {
    expect(goodEvents({ events: [{ ...event, screen: 'Free text' }, event] })?.events).toEqual([event]);
  });

  it('limits the batch size', () => {
    const events = Array.from({ length: MAX_ANALYTICS_BATCH + 1 }, () => event);
    expect(accepted(events)).toBe(false);
    expect(accepted([])).toBe(false);
  });

  it('drops personal fields and refuses free text in codes (G12, docs/29)', () => {
    const extra = { ...event, phone: '+998901234567', name: 'screen_open', firstName: 'Ali' };
    const [parsed] = goodEvents({ events: [extra] })?.events ?? [];
    expect(JSON.stringify(parsed)).not.toMatch(/998|Ali/);
    const apiError = { ...event, name: 'api_error' };
    expect(accepted([{ ...apiError, code: 'users.blocked' }])).toBe(true);
    expect(accepted([{ ...apiError, code: 'Ali Valiyev' }])).toBe(false);
  });
});
