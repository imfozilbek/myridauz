import { afterAll, describe, expect, it, vi } from 'vitest';
import { json, read } from './bookings-test-api';
import { testD1 } from './test-d1';
import { call } from './test-api';

const sent: string[] = [];
vi.stubGlobal('fetch', async (input: string) => {
  sent.push(input.split('/').pop() ?? '');
  const result = input.endsWith('createChatInviteLink')
    ? { invite_link: 'https://t.me/+ad' }
    : { message_id: 1 };
  return Response.json({ ok: true, result });
});
afterAll(() => vi.unstubAllGlobals());

const env = { DB: testD1() };
const OWNER = 900;
const main =
  (id: number, init: RequestInit = {}) =>
  (path: string) =>
    call(path, id, { app: 'main', env, ...init });
const answers = (role: 'passenger' | 'driver', region = '1718') => ({
  role,
  pains: role === 'driver' ? ['empty'] : ['chats'],
  home: region,
  region,
  cadence: role === 'driver' ? 'daily' : 'weekly',
});

describe('the questionnaire of the main bot (G83, docs/181)', () => {
  it('reads and writes only the waitlist, and only from the main app', async () => {
    expect((await call('/me', 1, { app: 'main', env })).status).toBe(403);
    expect((await call('/waitlist', 1, { env })).status).toBe(403);
    expect((await call('/waitlist', 1, { app: 'main' })).status).toBe(503);
  });

  it('opens with the first touch and saves the answers at «Qachon»', async () => {
    const opened = await read<{ open: boolean; entries: unknown[] }>(
      main(1)('/waitlist?via=ad-k7f2qx&client=ios%2011.2'),
    );
    expect(opened).toMatchObject({ open: true, entries: [] });
    const saved = await read<{ entries: { role: string; region: string }[] }>(
      call('/waitlist', 1, { app: 'main', env, ...json(answers('passenger'), 'PUT') }),
    );
    expect(saved.entries).toEqual([expect.objectContaining({ role: 'passenger', region: '1718' })]);
    const bad = { ...answers('passenger'), home: '1703', region: '1718' };
    expect((await call('/waitlist', 1, { app: 'main', env, ...json(bad, 'PUT') })).status).toBe(400);
  });

  it('invites a friend with a card of the main bot or a plain link', async () => {
    const invited = await read<{ prepared: string | null; link: string }>(
      call('/waitlist/invite', 1, { app: 'main', env, ...json({ role: 'passenger' }) }),
    );
    expect(invited.link).toMatch(/start=fr-[a-z0-9]{8}$/u);
    expect(sent).toContain('savePreparedInlineMessage');
    const none = await call('/waitlist/invite', 2, {
      app: 'main',
      env,
      ...json({ role: 'driver' }),
    });
    expect(none.status).toBe(404);
  });
});

describe('the waitlist of the team (docs/181, docs/183, docs/184)', () => {
  const admin = (path: string, init: RequestInit = {}, id = OWNER) =>
    call(path, id, { app: 'admin', env, ...init });

  it('shows «Kutayotganlar», a direction and the «gold»', async () => {
    await call('/waitlist', 2, { app: 'main', env, ...json(answers('driver'), 'PUT') });
    const overview = await read<{ passengers: number; drivers: number }>(admin('/admin/waitlist'));
    expect(overview).toMatchObject({ passengers: 1, drivers: 1 });
    const direction = await read<{ region: string; drivers: { approved: number } }>(
      admin('/admin/waitlist/1718'),
    );
    expect(direction).toMatchObject({ region: '1718', drivers: { approved: 0 } });
    expect((await admin('/admin/waitlist/1726')).status).toBe(400);
    const gold = await read<{ sources: { source: string }[] }>(admin('/admin/waitlist-stats?period=week'));
    expect(gold.sources).toEqual(expect.arrayContaining([{ source: 'ad', opened: 1, listed: 1 }]));
    expect((await admin('/admin/waitlist-stats?period=year')).status).toBe(400);
  });

  it('opens a direction once: the bot rings the waiting people', async () => {
    sent.length = 0;
    const opening = await read<{ sent: number }>(admin('/admin/waitlist/1718/open', { method: 'POST' }));
    expect(opening.sent).toBe(2);
    expect(sent.filter((method) => method === 'sendMessage').length).toBeGreaterThanOrEqual(2);
  });

  it('the switch is the owner’s; the ad links lead into a bot of the trips', async () => {
    expect(await read(admin('/admin/waitlist-switch'))).toEqual({ open: true, at: null, links: 0 });
    const closed = await read<{ open: boolean }>(
      admin('/admin/waitlist-switch', { ...json({ open: false }, 'PUT') }),
    );
    expect(closed.open).toBe(false);
    const late = await call('/waitlist', 5, {
      app: 'main',
      env,
      ...json(answers('passenger'), 'PUT'),
    });
    expect(late.status).toBe(409);
    const input = {
      target: 'channel',
      channel: '-1002',
      place: 'telegram',
      name: 'Reklama',
      price: null,
      days: null,
      top: 0,
      pin: 0,
    };
    const bad = await admin('/admin/ad-links', { ...json(input) });
    expect(bad.status).toBe(400);
    const old = { ...input, target: 'bot', channel: null };
    expect((await admin('/admin/ad-links', { ...json(old) })).status).toBe(400);
    const bot = { ...input, target: 'passenger', channel: null };
    const made = await read<{ code: string; link: string }>(admin('/admin/ad-links', { ...json(bot) }));
    expect(made.link).toContain(`?startapp=__${made.code}`);
    const links = await read<{ links: unknown[] }>(admin('/admin/ad-links'));
    expect(links.links).toHaveLength(1);
    expect((await admin(`/admin/ad-links/${made.code}`)).status).toBe(200);
    expect((await admin('/admin/ad-links/ad-000000')).status).toBe(404);
  });

  // Owner, 17.10.2026: the moderators make ad links too; the switch of the list stays the owner's.
  it('lets a moderator make and read ad links, never the switch', async () => {
    const moderator = 77;
    await env.DB.prepare(
      "INSERT INTO team_members (user_id, role, added_by, added_at) VALUES (?, 'moderator', ?, 1)",
    )
      .bind(moderator, OWNER)
      .run();
    const input = { target: 'driver', channel: null, place: 'instagram', name: 'Bloger', price: 100_000 };
    const ad = { ...input, days: 1, top: 0, pin: 0 };
    const made = await read<{ link: string }>(admin('/admin/ad-links', { ...json(ad) }, moderator));
    expect(made.link).toContain('?startapp=__ad-');
    expect((await admin('/admin/ad-links', {}, moderator)).status).toBe(200);
    expect((await admin('/admin/waitlist-switch', {}, moderator)).status).toBe(403);
  });
});
