import { MINI_APPS, type FeedEvent, type MiniApp } from '@platform/contracts';
import { DurableObject } from 'cloudflare:workers';
import type { Bindings } from '../../../env';
import { closeCodeFor } from '../../../shared/sockets/close-code';

const CHANGED: FeedEvent = { type: 'changed' };

// The personal channel of one person (docs/64, G19): a socket per open Mini App. Sockets sleep
// between signals (WebSocket Hibernation): a quiet channel costs nothing.
export class UserFeed extends DurableObject<Bindings> {
  override async fetch(request: Request): Promise<Response> {
    const app = MINI_APPS.find((item) => item === request.headers.get('x-feed-app'));
    if (!app) return new Response(null, { status: 400 });
    if (new URL(request.url).pathname === '/signal') {
      this.signal(app);
      return new Response(null, { status: 204 });
    }
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ app });
    return new Response(null, { status: 101, webSocket: client });
  }

  // Only the Mini App of the bot that spoke hears it: a driver's news is not the passenger's screen.
  private signal(app: MiniApp) {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as { app: MiniApp };
      if (ws.readyState === WebSocket.OPEN && attachment.app === app) ws.send(JSON.stringify(CHANGED));
    }
  }

  // The client only listens: whatever it sends is ignored.
  override async webSocketMessage(): Promise<void> {}

  override async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    ws.close(closeCodeFor(code));
  }
}
