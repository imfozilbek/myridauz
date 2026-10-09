import { loadBrand } from '@platform/brands';
import { MY_CHANNELS_PATH, type MyChannels } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { read } from './bookings-test-api';
import { call, registerUser } from './test-api';

const PERSON = 95;
const [made, joined] = loadBrand().channels;
const NOT_MADE = made?.username;
const JOINED = joined?.username;

// getChatMember: one channel is not made yet; the person is in one channel.
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = JSON.parse(String(init?.body ?? '{}')) as { chat_id?: string };
  if (body.chat_id === `@${NOT_MADE}`) return Response.json({ ok: false }, { status: 400 });
  const status = body.chat_id === `@${JOINED}` ? 'member' : 'left';
  return Response.json({ ok: true, result: { status, message_id: 1 } });
});
afterAll(() => vi.unstubAllGlobals());

describe('«Kanallar» through the API in both apps (G65, docs/119)', () => {
  it('gives the channels that are there and «✓ Aʼzosiz», to a passenger and to a driver', async () => {
    await registerUser(PERSON);
    for (const app of ['passenger', 'driver'] as const) {
      const { channels } = await read<MyChannels>(call(MY_CHANNELS_PATH, PERSON, { app }));
      expect(channels.map((channel) => channel.username)).not.toContain(NOT_MADE);
      expect(channels.filter((channel) => channel.member)).toEqual([{ username: JOINED, member: true }]);
    }
  });
});
