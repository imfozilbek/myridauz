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

  it('keeps where the person came from on the first screen (docs/89 S3)', () => {
    expect(toDataPoint({ name: 'screen_open', source: 'find', ...base }, 0).blobs.at(-1)).toBe('find');
  });

  it('keeps the platform and the mark of the source of the first screen (G55, docs/116)', () => {
    const first = {
      name: 'screen_open',
      source: 'trip',
      via: 'ch-yol-andijon',
      client: 'ios 9.6 safari 17',
    } as const;
    expect(toDataPoint({ ...first, ...base }, 0).blobs.slice(5)).toEqual([
      'trip',
      '',
      '',
      'ios 9.6 safari 17',
      '',
      'ch-yol-andijon',
    ]);
  });

  it('keeps the time of the ready first screen and the platform (G72, docs/121 §4)', () => {
    const ready = toDataPoint({ name: 'app_ready', ms: 1840, client: 'android 9.6 chrome 83', ...base }, 7);
    expect(ready.blobs.slice(5)).toEqual(['', '', '', 'android 9.6 chrome 83']);
    expect(ready.doubles).toEqual([base.at, 7, 1840]);
  });

  it('keeps the error code', () => {
    expect(toDataPoint({ name: 'client_error', code: 'render', ...base }, 0).blobs[5]).toBe('render');
  });

  it('keeps what broke a screen after its code (G52, docs/112)', () => {
    const crash = {
      name: 'client_error',
      code: 'render',
      error: 'TypeError',
      detail: 'x is undefined',
      client: 'ios 8.0',
      where: 'index-abc.js:95:12345',
    } as const;
    expect(toDataPoint({ ...crash, ...base }, 0).blobs.slice(5)).toEqual([
      'render',
      'TypeError',
      'x is undefined',
      'ios 8.0',
      'index-abc.js:95:12345',
    ]);
    expect(toDataPoint({ name: 'client_error', code: 'render', ...base }, 0).blobs.slice(5)).toEqual([
      'render',
      '',
      '',
      '',
      '',
    ]);
  });

  it('keeps the way of a point, the length of an empty search and the navigator (G24)', () => {
    const detail = (event: Parameters<typeof toDataPoint>[0]) => toDataPoint(event, 0).blobs.at(-1);
    expect(detail({ name: 'place_point_saved', method: 'search', ...base })).toBe('search');
    expect(detail({ name: 'place_search_empty', length: 7, ...base })).toBe('7');
    expect(detail({ name: 'route_opened', navigator: 'yandex', ...base })).toBe('yandex');
    expect(detail({ name: 'home_tap', target: 'item', ...base })).toBe('item');
    expect(detail({ name: 'dock_state', state: 'offers', ...base })).toBe('offers');
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
