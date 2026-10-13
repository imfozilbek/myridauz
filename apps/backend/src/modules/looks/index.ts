import type { Bindings } from '../../env';
import { keepLooks } from './application/looks';
import { looksRoutes } from './http/looks-routes';
import { looksDeps } from './looks-deps';

const call = (input: string, init?: RequestInit) => fetch(input, init);
// The calls of the Cron tick of the looks: the other jobs of the tick keep the rest (docs/117).
const TICK_BUDGET = 24;

// The look of every bot and channel comes from the repository (G82, docs/180).
export const keepTelegramLooks = (env: Bindings) => keepLooks(looksDeps(env, call), TICK_BUDGET);
export const looksModule = looksRoutes((env) => looksDeps(env, call));
