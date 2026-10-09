import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { myChannels } from './application/my-channels';
import { membership } from './infrastructure/bot-admin';

const brand = loadBrand();
const [made, joined] = brand.channels;
const NOT_MADE = made?.username;
const JOINED = joined?.username;

// getChatMember: a channel the team has not made yet is an error; the person is in one channel.
const telegram = async (_input: string, init?: RequestInit) => {
  const { chat_id: chat } = JSON.parse(String(init?.body)) as { chat_id: string };
  if (chat === `@${NOT_MADE}`) return Response.json({ ok: false }, { status: 400 });
  return Response.json({ ok: true, result: { status: chat === `@${JOINED}` ? 'member' : 'left' } });
};

describe('«Kanallar» of a person (G65, docs/119)', () => {
  it('lists the zones whose channel is there and marks the one the person is in «✓ Aʼzosiz»', async () => {
    const mine = await myChannels({ zones: brand.channels, membership: membership(telegram, 'p') }, 5);
    expect(mine).toHaveLength(brand.channels.length - 1);
    expect(mine.map((channel) => channel.username)).not.toContain(NOT_MADE);
    expect(mine.filter((channel) => channel.member)).toEqual([{ username: JOINED, member: true }]);
  });

  it('knows no channel without the token of the bot', async () => {
    expect(
      await myChannels({ zones: brand.channels, membership: membership(telegram, undefined) }, 5),
    ).toEqual([]);
  });
});
