import { describe, expect, it } from 'vitest';
import { serverDataPoint, toDataPoint } from './data-point';

const base = {
  app: 'admin',
  screen: 'home',
  at: 1_790_000_000_000,
  sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
  version: '0.1.0',
} as const;

describe('toDataPoint', () => {
  it('maps a screen event', () => {
    expect(toDataPoint({ name: 'screen_open', ...base }, 1_790_000_000_500)).toEqual({
      indexes: ['admin'],
      blobs: ['screen_open', 'admin', 'home', '0.1.0', base.sessionId, ''],
      doubles: [1_790_000_000_000, 1_790_000_000_500],
    });
  });

  it('keeps the error code', () => {
    expect(toDataPoint({ name: 'client_error', code: 'render', ...base }, 0).blobs.at(-1)).toBe('render');
  });

  it('writes a bot event of the backend with its bot and id (G12)', () => {
    const point = serverDataPoint({ name: 'bot_command', source: 'driver', code: 'start' }, 5);
    expect(point).toEqual({
      indexes: ['server'],
      blobs: ['bot_command', 'driver', '', '', '', 'start'],
      doubles: [5, 5],
    });
    expect(serverDataPoint({ name: 'driver_approved' }, 5).blobs).toEqual([
      'driver_approved',
      'server',
      '',
      '',
      '',
      '',
    ]);
  });
});
