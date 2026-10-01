import { loadBrand } from '@platform/brands';
import { DurableObject } from 'cloudflare:workers';
import { CHAT_SYSTEM_EVENTS } from '@platform/contracts';
import type { Bindings } from '../../../env';
import type { ChatSocket, Member, RoomDeps } from '../application/ports';
import { callLeft, callTimeout } from '../application/call-room';
import { received } from '../application/dispatch';
import { joined, systemEvent } from '../application/room';
import { botSignals } from './bot-signals';
import { sqlMessages } from './sql-messages';
import { closeCodeFor } from '../../../shared/sockets/close-code';

const HISTORY_LIMIT = 100;
const SECOND = 1000;
const KEY = 'key';

// One Durable Object is one booking chat (docs/07). Sockets sleep between messages
// (WebSocket Hibernation): a quiet chat costs nothing.
export class ChatRoom extends DurableObject<Bindings> {
  private readonly store = sqlMessages(this.ctx.storage.sql);

  private deps(key: string): RoomDeps {
    const { calls } = loadBrand(this.env.BRAND);
    return {
      key,
      store: this.store,
      // A closing socket is not in the chat any more.
      sockets: () =>
        this.ctx
          .getWebSockets()
          .filter((ws) => ws.readyState === WebSocket.OPEN)
          .map((ws) => this.socket(ws)),
      signals: botSignals(this.env),
      now: Date.now,
      calls: { ringMs: calls.ringSeconds * SECOND, connectMs: calls.connectSeconds * SECOND },
      wakeAt: (at) => void (at === null ? this.ctx.storage.deleteAlarm() : this.ctx.storage.setAlarm(at)),
    };
  }

  private socket(ws: WebSocket): ChatSocket {
    const { member } = ws.deserializeAttachment() as { member: Member; key: string };
    return { member, send: (data) => ws.send(data) };
  }

  override async fetch(request: Request): Promise<Response> {
    const key = request.headers.get('x-chat-key') ?? '';
    // The team reads a chat only on a complaint; the backend writes that to the log first (docs/07).
    if (new URL(request.url).pathname === '/history') return Response.json(this.store.recent(HISTORY_LIMIT));
    // A deleted account (docs/30): the whole chat of its booking goes.
    if (new URL(request.url).pathname === '/forget') {
      await this.ctx.storage.deleteAll();
      return new Response(null, { status: 204 });
    }
    if (new URL(request.url).pathname === '/system') {
      const { event } = (await request.json()) as { event: string };
      const known = CHAT_SYSTEM_EVENTS.find((item) => item === event);
      if (known) systemEvent(this.deps(key), known);
      return new Response(null, { status: 204 });
    }
    const member = JSON.parse(request.headers.get('x-chat-member') ?? 'null') as Member;
    // The wake-up of a call does not know its chat: the key is kept (docs/08).
    await this.ctx.storage.put(KEY, key);
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
    ws.close(closeCodeFor(code));
    const { member, key } = ws.deserializeAttachment() as { member: Member; key: string };
    await callLeft(this.deps(key), member);
  }

  // A call nobody answered, or whose voice did not connect in time, ends here (docs/08).
  override async alarm(): Promise<void> {
    await callTimeout(this.deps((await this.ctx.storage.get<string>(KEY)) ?? ''));
  }
}
