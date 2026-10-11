// pnpm stand:check --at 23:30: the stand at another hour of the Tashkent day (G77, lessons 223, 231).
// The scenarios and the servers of the apps see the clock moved by libfaketime. workerd hangs under it
// and the browser is five times slower: both start without it (workerd-real.sh, the launch of the
// browser) and move their Date by the same shift (e2e/shift-date.ts), so the stand lives at that hour.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { HOUR_MS, tashkentDate, tashkentDayStart } from '../../packages/contracts/src/tashkent-time.ts';

const LIBFAKETIME = '/usr/lib/x86_64-linux-gnu/faketime/libfaketime.so.1';
const SECOND_MS = 1000;
const HOUR_MINUTES = 60;

// "23:30" → the seconds from now to that time of the Tashkent day of now.
export function shiftTo(at, now = Date.now()) {
  const [, hours, minutes] = /^(\d\d):(\d\d)$/u.exec(at ?? '')?.map(Number) ?? [];
  if (hours === undefined || hours > 23 || minutes > 59)
    throw new Error(`stand:check: --at takes a time of the day, 23:30; not ${at}`);
  const moment = tashkentDayStart(tashkentDate(now)) + (hours + minutes / HOUR_MINUTES) * HOUR_MS;
  return Math.round((moment - now) / SECOND_MS);
}

// The workerd that wrangler would start: the stand starts the same one, without libfaketime.
function workerdPath() {
  const wrangler = createRequire(createRequire(import.meta.url).resolve('wrangler/package.json'));
  return createRequire(wrangler.resolve('miniflare'))('workerd').default;
}

// The environment of the stands of the check: every process but workerd sees the clock moved.
export function hourEnv(at) {
  if (!existsSync(LIBFAKETIME))
    throw new Error('stand:check: --at needs libfaketime (apt-get install faketime)');
  const seconds = shiftTo(at);
  return {
    LD_PRELOAD: LIBFAKETIME,
    FAKETIME: `${seconds >= 0 ? '+' : ''}${seconds}`,
    // The timers and timeouts keep the real pace; only the time of the day moves.
    DONT_FAKE_MONOTONIC: '1',
    FAKETIME_DONT_FAKE_MONOTONIC: '1',
    MINIFLARE_WORKERD_PATH: resolve('scripts/stand/workerd-real.sh'),
    STAND_WORKERD: workerdPath(),
    STAND_SHIFT_MS: String(seconds * SECOND_MS),
  };
}
