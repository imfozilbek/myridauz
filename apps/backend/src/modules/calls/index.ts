import type { Bindings } from '../../env';
import type { Realtime } from './application/ports';
import { callRoutes, type CanCall } from './http/call-routes';
import { realtimeApi } from './infrastructure/realtime-api';

// Realtime needs its app and TURN key (secrets of the Worker, docs/46); without them calls are off.
function realtimeOf(env: Bindings): Realtime | null {
  const { REALTIME_APP_ID: appId, REALTIME_APP_SECRET: appSecret } = env;
  const { TURN_KEY_ID: turnKeyId, TURN_KEY_TOKEN: turnKeyToken } = env;
  if (!appId || !appSecret || !turnKeyId || !turnKeyToken) return null;
  return realtimeApi({
    appId,
    appSecret,
    turnKeyId,
    turnKeyToken,
    fetch: (input, init) => fetch(input, init),
  });
}

export const callsModule = (canCall: CanCall) => callRoutes(canCall, realtimeOf);

// Without Realtime set up the call button is not shown at all (docs/08).
export const callsReady = (env: Bindings) => realtimeOf(env) !== null;
