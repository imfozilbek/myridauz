import { describe, expect, it } from 'vitest';
import { createAd, heardChange, listAds, oneAd, readSwitch, setSwitch } from './application/ads';
import { saveAnswers } from './application/person';
import { driverAnswers, passengerAnswers, setup } from './test-kit';

const INPUT = {
  place: 'telegram',
  name: 'Toshkent eʼlonlari',
  price: 300_000,
  days: 3,
  top: 1,
  pin: 24,
} as const;

describe('«Reklama havolalari» (G83, docs/184)', () => {
  it('makes a link into the main bot with a mark and counts what it gave', async () => {
    const kit = setup();
    const made = await createAd(kit.ads, { ...INPUT, target: 'bot', channel: null }, 900);
    if (typeof made === 'string') throw new Error(made);
    expect(made.code).toMatch(/^ad-[a-z0-9]{6}$/u);
    expect(made.link).toBe(`https://t.me/main_bot?start=${made.code}`);
    await kit.deps.visits.started(1, made.code, kit.at());
    await kit.deps.visits.started(2, made.code, kit.at());
    await kit.deps.visits.opened(1, null, 'android', kit.at());
    await saveAnswers(kit.deps, 1, passengerAnswers());
    await saveAnswers(kit.deps, 1, driverAnswers());
    const friend = await kit.deps.visits.of(1);
    await kit.deps.visits.started(3, `fr-${friend.code}`, kit.at());
    await saveAnswers(kit.deps, 3, passengerAnswers());
    await kit.db
      .prepare("INSERT INTO channel_members (chat, user_id, member, at) VALUES ('-1001', 1, 1, 1)")
      .run();
    expect((await oneAd(kit.ads, made.code))?.result).toEqual({
      clicked: 2,
      opened: 1,
      passengers: 1,
      drivers: 1,
      joined: 1,
      stayed: 0,
      byFriends: 1,
    });
    expect(kit.journal).toEqual([`900 ${made.code} ad`]);
  });

  it('makes a channel link by its own invite link and counts joins, leaves and records', async () => {
    const kit = setup();
    const made = await createAd(kit.ads, { ...INPUT, target: 'channel', channel: '-1001' }, 900);
    if (typeof made === 'string') throw new Error(made);
    expect(made.link).toBe('https://t.me/+18xyz');
    const join = (userId: number, member: boolean, invite: string | null) =>
      heardChange(kit.ads.ads, { chat: '-1001', userId, member, at: kit.at(), invite });
    await join(1, true, made.link);
    await join(2, true, made.link);
    await join(3, true, 'https://t.me/+other');
    await join(2, false, null);
    await saveAnswers(kit.deps, 1, passengerAnswers());
    const [listed] = await listAds(kit.ads);
    expect(listed?.result).toMatchObject({ joined: 2, stayed: 1, passengers: 1 });
  });

  it('refuses a channel of another brand and a channel where the bot is no admin', async () => {
    const kit = setup();
    expect(await createAd(kit.ads, { ...INPUT, target: 'channel', channel: '-999' }, 900)).toBe('invalid');
    expect(await createAd(kit.ads, { ...INPUT, target: 'channel', channel: '@main' }, 900)).toBe('not_admin');
    expect(await oneAd(kit.ads, 'ad-zzzzzz')).toBeNull();
  });
});

describe('the switch «Roʻyxatga yozish» (docs/181)', () => {
  it('is on until the owner turns it off; the change goes to the journal', async () => {
    const kit = setup();
    expect(await readSwitch(kit.ads)).toEqual({ open: true, at: null, links: 0 });
    expect(await setSwitch(kit.ads, false, 900)).toEqual({ open: false, at: kit.at(), links: 0 });
    expect(kit.journal).toEqual(['900 switch list_close']);
  });
});
