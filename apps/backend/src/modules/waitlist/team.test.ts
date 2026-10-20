import { describe, expect, it } from 'vitest';
import { refreshCards, tellOpened } from './application/bot-jobs';
import { waitlistStats } from './application/gold';
import { saveAnswers } from './application/person';
import { direction, openDirection, overview } from './application/team';
import { WEEK_MS } from './domain/waiting';
import { driverAnswers, passengerAnswers, setup } from './test-kit';

const DAY_MS = 24 * 3_600_000;

async function filled() {
  const kit = setup();
  await saveAnswers(kit.deps, 1, passengerAnswers({ pains: ['chats', 'phone'], cadence: 'weekly' }));
  await saveAnswers(kit.deps, 2, passengerAnswers({ pains: ['chats'], cadence: 'monthly' }));
  await saveAnswers(kit.deps, 3, passengerAnswers({ home: '1726', region: '1703', pains: ['wait'] }));
  await saveAnswers(kit.deps, 5, driverAnswers({ pains: ['empty', 'safety'] }));
  await saveAnswers(kit.deps, 1, driverAnswers({ cadence: 'sometimes' }));
  return kit;
}

describe('«Kutayotganlar» of the team (G83, docs/181)', () => {
  it('counts everyone, the directions with the most people first, the main pain of passengers', async () => {
    const kit = await filled();
    expect(await overview(kit.deps)).toEqual({
      passengers: 3,
      drivers: 2,
      directions: [
        { region: '1718', passengers: 2, drivers: 2, opened: null },
        { region: '1703', passengers: 1, drivers: 0, opened: null },
      ],
      topPain: { pain: 'chats', share: 67 },
    });
  });

  it('shows a direction: how often, the pains by share, the approved drivers', async () => {
    const kit = await filled();
    const seen = await direction(kit.deps, '1718');
    expect(seen.since).toBe(kit.at());
    expect(seen.passengers.count).toBe(2);
    expect(seen.passengers.cadences.slice(0, 2)).toEqual([
      { cadence: 'weekly', count: 1 },
      { cadence: 'monthly', count: 1 },
    ]);
    expect(seen.passengers.pains[0]).toEqual({ pain: 'chats', count: 2, share: 100 });
    expect(seen.drivers).toMatchObject({ count: 2, approved: 2 });
    expect(seen.drivers.pains[0]).toEqual({ pain: 'empty', count: 2, share: 100 });
  });
});

describe('«Ochish»: the bot tells the waiting people once (docs/181)', () => {
  it('opens once, counts the people to tell, rings them and marks them told', async () => {
    const kit = await filled();
    const opening = await openDirection(kit.deps, '1718', 900);
    expect(opening).toEqual({ at: kit.at(), sent: 4 });
    expect(kit.rung[0]?.map((view) => [view.record.userId, view.record.role, view.opened])).toEqual(
      expect.arrayContaining([
        [1, 'passenger', true],
        [2, 'passenger', true],
        [5, 'driver', true],
        [1, 'driver', true],
      ]),
    );
    kit.later(DAY_MS);
    expect(await openDirection(kit.deps, '1718', 900)).toEqual(opening);
    expect(await tellOpened(kit.deps, 50)).toBe(0);
    expect(kit.journal).toEqual(['900 1718 open']);
    // A new person on an open direction hears it in the next Cron run.
    await saveAnswers(kit.deps, 8, passengerAnswers());
    expect(await tellOpened(kit.deps, 50)).toBe(1);
  });

  it('never rings a person twice in a week, even for another direction', async () => {
    const kit = await filled();
    await openDirection(kit.deps, '1718', 900);
    await saveAnswers(kit.deps, 2, passengerAnswers({ home: '1726', region: '1703' }));
    kit.later(DAY_MS);
    await openDirection(kit.deps, '1703', 900);
    const told = (kit.rung.at(-1) ?? []).map((view) => view.record.userId);
    expect(told).toEqual([3]);
    kit.later(WEEK_MS);
    expect(await tellOpened(kit.deps, 50)).toBe(1);
  });

  // G89 A12: «Ochish» and a Cron run in the same second read the same people: one rings them.
  it('rings a person once when two runs read the list together', async () => {
    const kit = await filled();
    await openDirection(kit.deps, '1718', 900);
    await saveAnswers(kit.deps, 8, passengerAnswers());
    await Promise.all([tellOpened(kit.deps, 50), tellOpened(kit.deps, 50)]);
    const rung = kit.rung.slice(1).flat();
    expect(rung.map((view) => view.record.userId)).toEqual([8]);
  });
});

describe('the Monday update of the cards (docs/181)', () => {
  it('refreshes the cards not shown since Monday 00:00 of Tashkent, a few at a time', async () => {
    const kit = await filled();
    expect(await refreshCards(kit.deps, 10)).toBe(0);
    kit.later(6 * DAY_MS);
    expect(await refreshCards(kit.deps, 2)).toBe(2);
    expect(await refreshCards(kit.deps, 10)).toBe(3);
    expect(await refreshCards(kit.deps, 10)).toBe(0);
  });
});

describe('the «gold» of the statistics (docs/183)', () => {
  it('tells sources, platforms, hours, the shortage and how often, from the period', async () => {
    const kit = setup(Date.parse('2026-10-14T05:30:00Z'));
    await kit.deps.visits.opened(1, 'ad-k7f2qx', 'android', kit.at());
    await kit.deps.visits.opened(2, null, 'ios', kit.at());
    await kit.deps.visits.opened(3, 'fr-abcdefgh', 'android', kit.at());
    await saveAnswers(kit.deps, 1, passengerAnswers());
    await saveAnswers(kit.deps, 3, passengerAnswers({ cadence: 'once' }));
    await saveAnswers(kit.deps, 3, driverAnswers());
    await kit.deps.visits.invited(1, kit.at());
    await kit.db.prepare("UPDATE waitlist SET via = 'fr-abcdefgh' WHERE telegram_id = 3").run();
    const stats = await waitlistStats(kit.deps.reads, kit.at() - DAY_MS);
    expect([...stats.sources].sort((a, b) => a.source.localeCompare(b.source))).toEqual([
      { source: 'ad', opened: 1, listed: 1 },
      { source: 'direct', opened: 1, listed: 0 },
      { source: 'friend', opened: 1, listed: 1 },
    ]);
    expect(stats.devices).toEqual([
      { platform: 'android', opened: 2, listed: 2 },
      { platform: 'ios', opened: 1, listed: 0 },
    ]);
    expect(stats.after).toEqual({ listed: 2, joined: 0, invited: 1, byFriends: 2 });
    expect(stats.hours).toEqual([{ from: 9, count: 3 }]);
    expect(stats.shortage).toEqual([{ region: '1718', passengers: 2, drivers: 1 }]);
    expect(stats.cadences).toEqual(expect.arrayContaining([{ cadence: 'once', count: 1 }]));
    expect(stats.bothRoles).toBe(1);
  });
});
