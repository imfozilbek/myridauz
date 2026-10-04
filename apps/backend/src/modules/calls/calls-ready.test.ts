import { describe, expect, it } from 'vitest';
import { callsReady } from './index';

// The call button exists only when calls work: without Realtime and TURN keys the chat says
// canCall: false, so nobody meets calls.unavailable (G52, docs/112).
describe('callsReady', () => {
  const keys = {
    REALTIME_APP_ID: 'app',
    REALTIME_APP_SECRET: 'secret',
    TURN_KEY_ID: 'turn',
    TURN_KEY_TOKEN: 'token',
  };

  it('is off while any key of Realtime is missing', () => {
    expect(callsReady({})).toBe(false);
    expect(callsReady({ REALTIME_APP_ID: 'app', REALTIME_APP_SECRET: 'secret', TURN_KEY_ID: 'turn' })).toBe(
      false,
    );
  });

  it('is on with all four keys', () => {
    expect(callsReady(keys)).toBe(true);
  });
});
