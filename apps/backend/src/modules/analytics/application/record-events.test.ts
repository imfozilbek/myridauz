import { describe, expect, it } from 'vitest';
import type { DataPoint } from '../domain/data-point';
import { recordEvents } from './record-events';

describe('recordEvents', () => {
  it('writes every event of the batch', () => {
    const written: DataPoint[] = [];
    const event = {
      name: 'screen_open',
      app: 'driver',
      screen: 'home',
      at: 1,
      sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
      version: '0.1.0',
    } as const;
    const count = recordEvents({ write: (point) => written.push(point) }, { events: [event, event] }, 2);
    expect(count).toBe(2);
    expect(written).toHaveLength(2);
  });
});
