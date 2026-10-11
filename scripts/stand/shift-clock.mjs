// The clock of the Worker of the stand, moved by STAND_SHIFT_MS (wrangler --define, stand.mjs) before
// the Worker loads (shifted-worker.mjs).
/* global STAND_SHIFT_MS */
import { shiftDate } from '../../e2e/shift-date.ts';

shiftDate(STAND_SHIFT_MS);

// A Durable Object sets its alarm by the moved clock, workerd rings it by the real one: the alarm of
// «in 5 seconds» would ring hours later (lesson 237). Its time moves back on the way in, forward on
// the way out; once, on the storage of every object.
let realAlarms = false;
function ringOnTime(storage) {
  if (realAlarms) return;
  realAlarms = true;
  const shared = Object.getPrototypeOf(storage);
  const { setAlarm, getAlarm } = shared;
  shared.setAlarm = function (at, options) {
    return setAlarm.call(this, Number(at) - STAND_SHIFT_MS, options);
  };
  shared.getAlarm = async function (options) {
    const at = await getAlarm.call(this, options);
    return at === null ? null : at + STAND_SHIFT_MS;
  };
}

export const withRealAlarms = (DurableObject) =>
  class extends DurableObject {
    constructor(ctx, env) {
      ringOnTime(ctx.storage);
      super(ctx, env);
    }
  };
