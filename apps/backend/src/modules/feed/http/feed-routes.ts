import {
  FEED_SOCKET_PATH,
  MINI_APPS,
  type ApiErrorCode,
  type FeedEvent,
  type MiniApp,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { readTicket, signTicket } from '../../../shared/auth/signed-ticket';
import { feedName, type FeedSignal } from '../domain/feed-signals';

const PURPOSE = 'feed-ticket';
type Payload = { readonly userId: number; readonly app: MiniApp };
const secretOf = (env: Bindings) => env.PASSENGER_BOT_TOKEN ?? '';
const fail = (code: ApiErrorCode, status: 400 | 403 | 503) => Response.json({ error: code }, { status });

async function payloadOf(env: Bindings, ticket: string): Promise<Payload | null> {
  const data = (await readTicket(secretOf(env), PURPOSE, ticket, Date.now())) as Payload | null;
  return data && Number.isInteger(data.userId) && MINI_APPS.includes(data.app) ? data : null;
}

// The signed API gives a ticket for the person's own channel; the socket shows it (docs/64).
export const feedRoutes = new Hono<AppEnv>()
  .post('/feed/ticket', async (context) => {
    const { user, app } = context.get('session');
    const ticket = await signTicket(secretOf(context.env), PURPOSE, { userId: user.id, app }, Date.now());
    const url = new URL(FEED_SOCKET_PATH, context.req.url);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('ticket', ticket);
    return context.json({ url: url.toString() });
  })
  .get(FEED_SOCKET_PATH, async (context) => {
    const payload = await payloadOf(context.env, context.req.query('ticket') ?? '');
    if (!payload) return fail('feed.invalid_ticket', 403);
    if (context.req.header('upgrade') !== 'websocket') return fail('feed.invalid_ticket', 400);
    const feeds = context.env.FEEDS;
    if (!feeds) return fail('feed.invalid_ticket', 503);
    const headers = new Headers(context.req.raw.headers);
    headers.set('x-feed-app', payload.app);
    const feed = feeds.get(feeds.idFromName(feedName(payload.userId)));
    return feed.fetch(new Request('https://feed/socket', { headers }));
  });

// "Something changed" to the open Mini Apps of these people. Never breaks the action that caused it:
// the screen also refreshes when the person comes back to the app (docs/64).
export async function sendSignals(env: Bindings, signals: readonly FeedSignal[]): Promise<void> {
  const feeds = env.FEEDS;
  if (!feeds || signals.length === 0) return;
  const results = await Promise.allSettled(
    signals.map(({ userId, app }) =>
      feeds
        .get(feeds.idFromName(feedName(userId)))
        .fetch(new Request('https://feed/signal', { method: 'POST', headers: { 'x-feed-app': app } })),
    ),
  );
  for (const result of results) if (result.status === 'rejected') console.warn(String(result.reason));
}

// One event to the open Mini App of one person: the chat of a ringing call opens itself (docs/115).
export async function sendEvent(env: Bindings, { userId, app }: FeedSignal, event: FeedEvent): Promise<void> {
  const feeds = env.FEEDS;
  if (!feeds) return;
  const request = new Request('https://feed/signal', {
    method: 'POST',
    headers: { 'x-feed-app': app, 'content-type': 'application/json' },
    body: JSON.stringify(event),
  });
  await feeds
    .get(feeds.idFromName(feedName(userId)))
    .fetch(request)
    .catch((error: unknown) => console.warn(String(error)));
}
