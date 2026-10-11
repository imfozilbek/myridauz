// The Worker of the stand at another hour (pnpm stand:check --at, G77): its clock moves by the same
// shift as the clock of the scenarios and the browser. The clock moves first, then the Worker loads.
import { withRealAlarms } from './shift-clock.mjs';
import * as backend from '../../apps/backend/src/index.ts';

export * from '../../apps/backend/src/index.ts';
export default backend.default;
// Every Durable Object of the Worker: their alarms ring by the real clock.
export const ChatRoom = withRealAlarms(backend.ChatRoom);
export const UserFeed = withRealAlarms(backend.UserFeed);
