import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../../env';
import type { Member } from './application/ports';
import { ChatRoom } from './infrastructure/chat-room';
import { wireChatRights } from './infrastructure/fresh-rights';
import { DRIVER } from './chat-test-kit';
import { nodeSql } from './test-node-sql';

// The base class of a Durable Object keeps its state and env, as in the Worker.
vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    constructor(
      readonly ctx: unknown,
      readonly env: unknown,
    ) {}
  },
}));

const OPEN = 1;
function openSocket(member: Member) {
  let attachment: unknown = { member, key: 'b1' };
  return {
    readyState: OPEN,
    deserializeAttachment: () => attachment,
    serializeAttachment: (next: unknown) => void (attachment = next),
    send: vi.fn(),
    close: vi.fn(),
    attachment: () => attachment as { member: Member },
  };
}
function roomWith(ws: ReturnType<typeof openSocket>) {
  const storage = { sql: nodeSql(), setAlarm: vi.fn(), deleteAlarm: vi.fn(), put: vi.fn(), get: vi.fn() };
  const ctx = { storage, getWebSockets: () => [ws] };
  return new ChatRoom(ctx as unknown as DurableObjectState, {} as Bindings);
}
const asSocket = (ws: ReturnType<typeof openSocket>) => ws as unknown as WebSocket;

afterEach(() => wireChatRights(async () => null));

// G89 C1, C2: an open chat asks the rights again at each event: a block, a deletion or a cancel
// since the socket opened ends it; changed rights (no call any more) are taken at once.
describe('the rights of an open chat', () => {
  it('closes the socket of a person who may not write any more', async () => {
    wireChatRights(async () => null);
    const ws = openSocket(DRIVER);
    await roomWith(ws).webSocketMessage(asSocket(ws), JSON.stringify({ type: 'message', text: 'Salom' }));
    expect(ws.close).toHaveBeenCalledWith(4403, 'rights');
    expect(ws.send).not.toHaveBeenCalled();
  });

  it('takes the rights of now for the next event', async () => {
    const now = { ...DRIVER, canCall: false };
    wireChatRights(async () => now);
    const ws = openSocket(DRIVER);
    await roomWith(ws).webSocketMessage(asSocket(ws), '{}');
    expect(ws.close).not.toHaveBeenCalled();
    expect(ws.attachment().member).toEqual(now);
  });
});
