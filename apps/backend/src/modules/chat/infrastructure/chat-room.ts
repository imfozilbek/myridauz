import { DurableObject } from 'cloudflare:workers';
import { CHAT_SYSTEM_EVENTS } from '@platform/contracts';
import type { Bindings } from '../../../env';
import type { ChatSocket, Member, RoomDeps } from '../application/ports';
import { callLeft, callTimeout } from '../application/call-room';
import { received } from '../application/dispatch';
import { joined, sendText, systemEvent } from '../application/room';
import { botSignals } from './bot-signals';
import { d1Unread } from './d1-unread';
import { sqlMessages } from './sql-messages';
import { closeCodeFor } from '../../../shared/sockets/close-code';
import { rightsNow } from './fresh-rights';
import { brandOf } from '../../../shared/brand/brand-of';

const HISTORY_LIMIT = 100;
// The socket of a person who may not write or ring any more (G89 C1): a block, a deletion, a cancel.
const NO_RIGHTS = 4403;
const SECOND = 1000;
const KEY = 'key';

// One Durable Object is one booking chat (docs/07). Sockets sleep between messages
// (WebSocket Hibernation): a quiet chat costs nothing.
export class ChatRoom extends DurableObject<Bindings> {
  private readonly store = sqlMessages(this.ctx.storage.sql);

  private deps(key: string): RoomDeps {
    const { calls } = brandOf(this.env);
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
      unread: d1Unread(this.env, key),
      now: Date.now,
      calls: {
        ringMs: calls.ringSeconds * SECOND,
        connectMs: calls.connectSeconds * SECOND,
        inviteMs: calls.inviteSeconds * SECOND,
      },
      wakeAt: (at) => void (at === null ? this.ctx.storage.deleteAlarm() : this.ctx.storage.setAlarm(at)),
    };
  }

  private socket(ws: WebSocket): ChatSocket {
    const { member } = ws.deserializeAttachment() as { member: Member; key: string };
    // A socket closed meanwhile hears nothing; the rest of the step goes on (G89, the full stand).
    return { member, send: (data) => (ws.readyState === WebSocket.OPEN ? ws.send(data) : undefined) };
  }

  override async fetch(request: Request): Promise<Response> {
    const key = request.headers.get('x-chat-key') ?? '';
    // The team reads a chat only on a complaint; the backend writes that to the log first (docs/07).
    if (new URL(request.url).pathname === '/history') return Response.json(this.store.recent(HISTORY_LIMIT));
    // A deleted account (docs/30): the whole chat of its booking goes. Rows, not the database: a room
    // that lives on keeps its tables, the other side's chat works at once (G89).
    if (new URL(request.url).pathname === '/forget') {
      this.store.forget();
      await this.ctx.storage.delete(KEY);
      await this.ctx.storage.deleteAlarm();
      return new Response(null, { status: 204 });
    }
    if (new URL(request.url).pathname === '/system') {
      const { event } = (await request.json()) as { event: string };
      const known = CHAT_SYSTEM_EVENTS.find((item) => item === event);
      if (known) systemEvent(this.deps(key), known);
      return new Response(null, { status: 204 });
    }
    const member = JSON.parse(request.headers.get('x-chat-member') ?? 'null') as Member;
    // A ready answer from the sheet of the Mini App (G68): as from a socket that hears nothing back.
    if (new URL(request.url).pathname === '/send') {
      await sendText(this.deps(key), { member, send: () => undefined }, await request.text());
      return new Response(null, { status: 204 });
    }
    // The wake-up of a call does not know its chat: the key is kept (docs/08).
    await this.ctx.storage.put(KEY, key);
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ member, key });
    await joined(this.deps(key), this.socket(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  // Each event asks again who may write and ring now: the rights of the ticket do not last (G89 C1).
  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    const { key, member } = ws.deserializeAttachment() as { member: Member; key: string };
    const fresh = await rightsNow(this.env, key, member.userId);
    if (!fresh) return ws.close(NO_RIGHTS, 'rights');
    ws.serializeAttachment({ member: fresh, key });
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
