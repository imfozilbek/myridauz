import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { inviteToZone, tellsHome, type ZoneInviteDeps } from './application/zone-invite';
import { zoneMessage } from './infrastructure/zone-message';

const brand = loadBrand();
const zone = brand.channels[0];

function setup(change: Partial<ZoneInviteDeps> = {}) {
  const claimed = new Set<number>();
  const sent: unknown[] = [];
  const deps: ZoneInviteDeps = {
    enabled: true,
    claim: async (userId) => !claimed.has(userId) && Boolean(claimed.add(userId)),
    inChannel: async () => false,
    message: zoneMessage(brand),
    send: async (jobs) => void sent.push(...jobs),
    ...change,
  };
  return { deps, sent };
}

describe('the channel of the zone after the registration (docs/119 row 6)', () => {
  it('invites once with «Kanalga oʻtish» and «Safar topish»', async () => {
    const { deps, sent } = setup();
    await inviteToZone(deps, 5, zone);
    await inviteToZone(deps, 5, zone);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ bot: 'passenger', chatId: 5 });
    const markup = JSON.stringify(sent[0]);
    expect(markup).toContain(`"url":"https://t.me/${zone?.username ?? ''}"`);
    expect(markup).toContain('Kanalga oʻtish');
    expect(markup).toContain('Safar topish');
  });

  it('spends the one chance on a place without a channel, like Toshkent', async () => {
    const { deps, sent } = setup();
    await inviteToZone(deps, 6, undefined);
    await inviteToZone(deps, 6, zone);
    expect(sent).toEqual([]);
  });

  it('skips a member of the channel, and everything while the channel posts are off', async () => {
    const member = setup({ inChannel: async () => true });
    await inviteToZone(member.deps, 7, zone);
    const off = setup({ enabled: false });
    await inviteToZone(off.deps, 7, zone);
    expect([...member.sent, ...off.sent]).toEqual([]);
  });

  it('never stops the person when Telegram fails', async () => {
    const { deps } = setup({ inChannel: async () => Promise.reject(new Error('telegram.down')) });
    await expect(inviteToZone(deps, 8, zone)).resolves.toBeUndefined();
  });

  it('knows a home by a district, a city or a one-city region only', () => {
    expect(tellsHome({ parentId: '1718', oneCity: false })).toBe(true);
    expect(tellsHome({ parentId: null, oneCity: true })).toBe(true);
    expect(tellsHome({ parentId: null, oneCity: false })).toBe(false);
    expect(tellsHome(undefined)).toBe(false);
  });
});
