import type { Context } from 'hono';
import type { AppEnv } from '../../env';
import { recordServerEvent } from '../../modules/analytics';

const NOT_FOUND = 404;
const SERVER_ERROR = 500;

// Every answer of the API carries a code the Mini App reads (G42, docs/111): an unknown path and
// a broken route too. The error goes to the log of the Worker and is counted in the analytics.
export const notFound = (context: Context<AppEnv>) => context.json({ error: 'not_found' }, NOT_FOUND);

export function onServerError(error: Error, context: Context<AppEnv>) {
  console.error(JSON.stringify({ event: 'server_error', path: context.req.path, message: error.message }));
  recordServerEvent(context.env ?? {}, { name: 'server_error', code: context.req.routePath });
  return context.json({ error: 'server.error' }, SERVER_ERROR);
}
