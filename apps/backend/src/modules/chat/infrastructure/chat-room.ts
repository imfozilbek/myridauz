import { DurableObject } from 'cloudflare:workers';
import { CHAT_SYSTEM_EVENTS } from '@platform/contracts';
import type { Bindings } from '../../../env';
import type { ChatSocket, Member, RoomDeps } from '../application/ports';
import { joined, received, systemEvent } from '../application/room';
import { botSignals } from './bot-signals';
import { sqlMessages } from './sql-messages';

// One Durable Object is one booking chat (docs/07). Sockets sleep between messages
// (WebSocket Hibernation): a quiet chat costs nothing.
export class ChatRoom extends DurableObject<Bindings> {
  private readonly store = sqlMessages(this.ctx.storage.sql);

  private deps(key: string): RoomDeps {
    return {
      key,
      store: this.store,
      sockets: () => this.ctx.getWebSockets().map((ws) => this.socket(ws)),
      signals: botSignals(this.env),
      now: Date.now,
    };
  }

  private socket(ws: WebSocket): ChatSocket {
    const { member } = ws.deserializeAttachment() as { member: Member; key: string };
    return { member, send: (data) => ws.send(data) };
  }

  override async fetch(request: Request): Promise<Response> {
    const key = request.headers.get('x-chat-key') ?? '';
    if (new URL(request.url).pathname === '/system') {
      const { event } = (await request.json()) as { event: string };
      const known = CHAT_SYSTEM_EVENTS.find((item) => item === event);
      if (known) systemEvent(this.deps(key), known);
      return new Response(null, { status: 204 });
    }
    const member = JSON.parse(request.headers.get('x-chat-member') ?? 'null') as Member;
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ member, key });
    joined(this.deps(key), this.socket(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    const { key } = ws.deserializeAttachment() as { key: string };
    await received(this.deps(key), this.socket(ws), message);
  }

  override async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    ws.close(code);
  }
}
