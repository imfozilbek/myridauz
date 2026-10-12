import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { heard, myChannels } from './application/my-channels';
import { createMemoryChannelMembers } from './infrastructure/channel-members';

const brand = loadBrand();
const [broken, joined] = brand.channels;
const BROKEN = broken?.chat ?? '';
const JOINED = joined?.chat ?? '';
const PERSON = 5;

describe('«Kanallar» of a person (G80, docs/176)', () => {
  it('lists the channels the bot can post in and marks the ones the person is in «✓ Aʼzosiz»', async () => {
    const members = createMemoryChannelMembers();
    await members.mark({ chat: JOINED, userId: PERSON, member: true, at: 1 });
    await members.mark({ chat: BROKEN, userId: PERSON, member: true, at: 1 });
    const deps = { zones: brand.channels, members, broken: async () => new Set([BROKEN]) };
    const mine = await myChannels(deps, PERSON);
    expect(mine).toHaveLength(brand.channels.length - 1);
    expect(mine.map((channel) => channel.chat)).not.toContain(BROKEN);
    expect(mine.filter((channel) => channel.member)).toEqual([{ chat: JOINED, member: true }]);
  });

  it('keeps a join only of a person of the brand in a channel of the brand (docs/30)', async () => {
    const members = createMemoryChannelMembers();
    const deps = { members, chats: new Set([JOINED]), registered: async (id: number) => id === PERSON };
    await heard(deps, { chat: JOINED, userId: 6, member: true, at: 1 });
    await heard(deps, { chat: '-100999', userId: PERSON, member: true, at: 1 });
    expect([...(await members.joined(6)), ...(await members.joined(PERSON))]).toEqual([]);
    await heard(deps, { chat: JOINED, userId: PERSON, member: true, at: 1 });
    expect([...(await members.joined(PERSON))]).toEqual([JOINED]);
  });
});
