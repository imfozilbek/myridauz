import type { BrowserContext } from '@playwright/test';
import { HOUR_MS, tashkentDate, tashkentDayStart } from '@platform/contracts';
import { shiftDate } from './shift-date';

// The time of a test (lessons 204, 207): a seat of «today» leaves an hour after it, and the meeting opens
// 30 minutes before the departure. In the last hour of a Toshkent day no such hour is left, so from 23:00
// the mocks and the browser live at 22:00 of the same day. By day both keep the real clock.
const LATE_HOUR = 23;
const SAFE_HOUR = 22;
const real = Date.now();
const dayStart = tashkentDayStart(tashkentDate(real));
const late = real >= dayStart + LATE_HOUR * HOUR_MS;

export const TEST_NOW = late ? dayStart + SAFE_HOUR * HOUR_MS : real;

// The browser starts at the time of the mocks; its clock then runs as usual. The stand has a real
// backend (docs/75): the browser keeps the clock of the stand, moved with it by pnpm stand:check --at
// (G77); the late hour of the mocks once put it at 22:00 beside a backend at 23:20 (lesson 223).
export async function testClock(context: BrowserContext, stand: boolean): Promise<void> {
  const shift = Number(process.env['STAND_SHIFT_MS'] ?? 0);
  if (stand) {
    if (shift !== 0) await context.addInitScript(shiftDate, shift);
  } else if (late) await context.clock.install({ time: TEST_NOW });
}
