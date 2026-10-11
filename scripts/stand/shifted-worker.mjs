// The Worker of the stand at another hour (pnpm stand:check --at, G77): its clock moves by the same
// shift as the clock of the scenarios and the browser. The clock moves first, then the Worker loads.
import './shift-clock.mjs';

export * from '../../apps/backend/src/index.ts';
export { default } from '../../apps/backend/src/index.ts';
