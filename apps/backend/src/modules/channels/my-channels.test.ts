import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { heard, myChannels } from './application/my-channels';
import { createMemoryChannelMembers } from './infrastructure/channel-members';
import { createMemoryChannelDays } from './infrastructure/d1-channel-days';
import { createMemoryPostReactions } from './infrastructure/post-reactions';

const brand = loadBrand();
const [broken, joined] = brand.channels;
const BROKEN = broken?.chat ?? '';
const JOINED = joined?.chat ?? '';
const PERSON = 5;
const APP_LINK = 'https://t.me/+app';
// The hourly check: the bot may not post in the first channel; the second has its link «Rida ilovasi».
const health = async () => [
  { channel: BROKEN, subscribers: 1, canPost: false, checkedAt: 1, appLink: null },
  { channel: JOINED, subscribers: 1, canPost: true, checkedAt: 1, appLink: APP_LINK },
];

describe('«Kanallar» of a person (G80, docs/176)', () => {
  it('lists the channels the bot can post in and marks the ones the person is in «✓ Aʼzosiz»', async () => {
    const members = createMemoryChannelMembers();
    await members.mark({ chat: JOINED, userId: PERSON, member: true, at: 1 });
    await members.mark({ chat: BROKEN, userId: PERSON, member: true, at: 1 });
    const mine = await myChannels({ zones: brand.channels, members, health }, PERSON);
    expect(mine).toHaveLength(brand.channels.length - 1);
    expect(mine.map((channel) => channel.chat)).not.toContain(BROKEN);
    expect(mine.filter((channel) => channel.member)).toEqual([
      { chat: JOINED, member: true, link: APP_LINK },
    ]);
  });

  // Owner decision 4 (docs/176): the app opens the link «Rida ilovasi»; the link of the brand till then.
  it('gives the own link of the app in a channel, the link of the brand until the check made it', async () => {
    const mine = await myChannels(
      { zones: brand.channels, members: createMemoryChannelMembers(), health },
      PERSON,
    );
    const links = new Map(mine.map(({ chat, link }) => [chat, link]));
    expect(links.get(JOINED)).toBe(APP_LINK);
    expect(brand.channels.slice(2).every((channel) => links.get(channel.chat) === channel.link)).toBe(true);
  });

  it('keeps a join only of a person of the brand in a channel of the brand (docs/30)', async () => {
    const members = createMemoryChannelMembers();
    const registered = async (id: number) => id === PERSON;
    const days = createMemoryChannelDays();
    const deps = {
      members,
      chats: new Set([JOINED]),
      registered,
      days,
      reactions: createMemoryPostReactions(),
    };
    await heard(deps, { chat: JOINED, userId: 6, member: true, at: 1 }, false);
    await heard(deps, { chat: '-100999', userId: PERSON, member: true, at: 1 }, false);
    expect([...(await members.joined(6)), ...(await members.joined(PERSON))]).toEqual([]);
    await heard(deps, { chat: JOINED, userId: PERSON, member: true, at: 1 }, false);
    expect([...(await members.joined(PERSON))]).toEqual([JOINED]);
  });
});
