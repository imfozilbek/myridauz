import type { Context } from 'hono';
import type { AppEnv } from '../../env';
import { recordServerEvent } from '../../modules/analytics';

const NOT_FOUND = 404;
const SERVER_ERROR = 500;

// Every answer of the API carries a code the Mini App reads (G42, docs/111): an unknown path and
// a broken route too. The error goes to the log of the Worker and is counted in the analytics.
export const notFound = (context: Context<AppEnv>) => context.json({ error: 'not_found' }, NOT_FOUND);

// A broken route, or work after the answer that failed (G63): the log and the analytics both see it.
export function reportServerError(context: Context<AppEnv>, message: string) {
  console.error(JSON.stringify({ event: 'server_error', path: context.req.path, message }));
  recordServerEvent(context.env ?? {}, { name: 'server_error', code: context.req.routePath });
}

export function onServerError(error: Error, context: Context<AppEnv>) {
  reportServerError(context, error.message);
  return context.json({ error: 'server.error' }, SERVER_ERROR);
}
