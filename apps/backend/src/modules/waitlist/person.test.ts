import { describe, expect, it } from 'vitest';
import { fullScans } from '../../test-d1';
import { invite } from './application/invite';
import { openApp, readMe, saveAnswers } from './application/person';
import { driverAnswers, passengerAnswers, setup } from './test-kit';

describe('the questionnaire of a person (G83, docs/181)', () => {
  it('saves the answers at «Qachon», in the order of the screen, and tells the funnel once', async () => {
    const kit = setup();
    const me = await saveAnswers(kit.deps, 1, passengerAnswers({ pains: ['phone', 'chats'] }));
    expect(me?.entries).toEqual([
      expect.objectContaining({
        role: 'passenger',
        pains: ['chats', 'phone'],
        region: '1718',
        waiting: null,
      }),
    ]);
    await saveAnswers(kit.deps, 1, passengerAnswers({ cadence: 'monthly' }));
    expect(kit.listed).toEqual(['passenger']);
    expect((await readMe(kit.deps, 1)).entries[0]?.cadence).toBe('monthly');
    // Each save shows the live card of the bot and marks it shown for the Monday update.
    expect(kit.shown.at(-1)?.[0]?.record.cadence).toBe('monthly');
    expect(fullScans(kit.db)).toEqual([]);
  });

  it('keeps one record a role: a driver may wait as a passenger too', async () => {
    const kit = setup();
    await saveAnswers(kit.deps, 2, passengerAnswers());
    const me = await saveAnswers(kit.deps, 2, driverAnswers({ home: '1726', region: '1703' }));
    expect(me?.entries.map((entry) => [entry.role, entry.home, entry.region])).toEqual([
      ['passenger', '1718', '1718'],
      ['driver', '1726', '1703'],
    ]);
  });

  it('counts who waits from 10 passengers, with the share of the first pain', async () => {
    const kit = setup();
    for (let id = 10; id < 20; id += 1)
      await saveAnswers(kit.deps, id, passengerAnswers({ pains: id < 15 ? ['chats'] : ['wait'] }));
    await saveAnswers(kit.deps, 30, driverAnswers());
    const me = await readMe(kit.deps, 10);
    expect(me.entries[0]?.waiting).toEqual({ passengers: 10, drivers: 1, share: 50 });
    expect(me.channels).toEqual(['-1001']);
  });

  it('closed by the owner: no new record, an old one still changes', async () => {
    const kit = setup();
    await saveAnswers(kit.deps, 3, passengerAnswers());
    await kit.deps.switches.set(false, 900, kit.at());
    expect(await saveAnswers(kit.deps, 4, passengerAnswers())).toBeNull();
    expect(await saveAnswers(kit.deps, 3, passengerAnswers({ cadence: 'once' }))).not.toBeNull();
    expect((await readMe(kit.deps, 3)).open).toBe(false);
  });

  it('keeps the first touch: the mark of the first link stays with the record', async () => {
    const kit = setup();
    await kit.deps.visits.started(5, 'ad-k7f2qx', kit.at());
    await openApp(kit.deps, 5, 'ch-samarqand', 'android');
    await saveAnswers(kit.deps, 5, passengerAnswers());
    const row = await kit.db
      .prepare('SELECT via FROM waitlist WHERE telegram_id = 5')
      .first<{ via: string }>();
    const visit = await kit.db
      .prepare('SELECT via, platform, opened_at FROM waitlist_visits WHERE telegram_id = 5')
      .first<{ via: string; platform: string; opened_at: number }>();
    expect([row?.via, visit?.via, visit?.platform, visit?.opened_at]).toEqual([
      'ad-k7f2qx',
      'ad-k7f2qx',
      'android',
      kit.at(),
    ]);
  });

  it('invites a friend with the own code of the person, only with a record', async () => {
    const kit = setup();
    const prepare = async (_record: unknown, code: string) => ({
      prepared: 'p1',
      link: `https://t.me/b?start=fr-${code}`,
    });
    const inviteDeps = { ...kit.deps, prepare };
    expect(await invite(inviteDeps, 6, 'passenger')).toBeNull();
    await saveAnswers(kit.deps, 6, passengerAnswers());
    const invited = await invite(inviteDeps, 6, 'passenger');
    expect(invited?.link).toMatch(/start=fr-[a-z0-9]{8}$/u);
    const visit = await kit.db
      .prepare('SELECT invited_at FROM waitlist_visits WHERE telegram_id = 6')
      .first<{ invited_at: number }>();
    expect(visit?.invited_at).toBe(kit.at());
  });

  it('forgets everything of a deleted person (docs/58)', async () => {
    const kit = setup();
    await saveAnswers(kit.deps, 7, passengerAnswers());
    await kit.deps.records.forget(7);
    expect((await readMe(kit.deps, 7)).entries).toEqual([]);
    expect(await kit.db.prepare('SELECT 1 FROM waitlist_visits WHERE telegram_id = 7').first()).toBeNull();
  });
});
