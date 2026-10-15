import type { AnalyticsInput } from '@platform/api-client';
import { describe, expect, it, vi } from 'vitest';
import { reportCrashes } from './report-crashes';

describe('reportCrashes (G52, docs/112)', () => {
  it('sends an error outside a render and a promise nobody caught, at once', () => {
    const tracked: AnalyticsInput[] = [];
    const flush = vi.fn(async () => undefined);
    const target = new EventTarget();
    reportCrashes({ track: (event) => void tracked.push(event), flush }, 'android 8.0', target);
    const uncaught = Object.assign(new Event('error'), { error: new TypeError('x is undefined') });
    target.dispatchEvent(uncaught);
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'ui.analytics_missing' }));
    expect(tracked).toEqual([
      {
        name: 'client_error',
        screen: 'app',
        code: 'uncaught',
        error: 'TypeError',
        detail: 'x is undefined',
        client: 'android 8.0',
      },
      {
        name: 'client_error',
        screen: 'app',
        code: 'rejection',
        error: 'Thrown',
        detail: 'ui.analytics_missing',
        client: 'android 8.0',
      },
    ]);
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('does not count the hidden error of a script of another origin (lesson 283)', () => {
    const track = vi.fn();
    const target = new EventTarget();
    reportCrashes({ track, flush: async () => undefined }, 'ios 9.6', target);
    target.dispatchEvent(Object.assign(new Event('error'), { error: null, message: 'Script error.' }));
    expect(track).not.toHaveBeenCalled();
    target.dispatchEvent(Object.assign(new Event('error'), { error: null, message: 'Script error here' }));
    expect(track).toHaveBeenCalledTimes(1);
  });
});
