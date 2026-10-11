// The clock of the Worker of the stand, moved by STAND_SHIFT_MS (wrangler --define, stand.mjs) before
// the Worker loads (shifted-worker.mjs).
/* global STAND_SHIFT_MS */
import { shiftDate } from '../../e2e/shift-date.ts';

shiftDate(STAND_SHIFT_MS);
