import type { Context } from 'hono';
import type { AppEnv } from '../../env';
import { reportServerError } from '../http/errors';

// The Worker's own context of the request; tests and local runs have none.
function workerOf(context: Context<AppEnv>) {
  try {
    return context.executionCtx;
  } catch {
    return undefined;
  }
}

// Work the answer does not wait for (G63): the Worker ends it after the response (waitUntil).
// Without a Worker it is awaited, so tests and local runs see it at once. A failure never breaks
// the answer: it goes to the log and is counted like any server error (G42).
export async function afterResponse(context: Context<AppEnv>, work: () => Promise<void>): Promise<void> {
  const done = work().catch((error: unknown) => reportServerError(context, String(error)));
  const worker = workerOf(context);
  if (worker) worker.waitUntil(done);
  else await done;
}
