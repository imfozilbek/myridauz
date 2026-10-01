import { describe, expect, it } from 'vitest';
import { allChannels, removeChannel, saveChannel, type TeamChannelsDeps } from './application/team';
import { createMemoryTeamChannels } from './infrastructure/team-channels';

const SAMARQAND = '1718401';
const deps = (admin: boolean): TeamChannelsDeps => ({
  fixed: [{ username: 'zone_samarqand', title: 'Samarqand', places: [SAMARQAND] }],
  titleOf: (place) => (place === SAMARQAND ? 'Samarqand shahri' : undefined),
  store: createMemoryTeamChannels(),
  botIsAdmin: async () => admin,
  now: () => 0,
});
const input = { title: 'Sinov', places: [SAMARQAND] };

// A channel of the team (docs/63, G27 T46): only a good name, known places, and the bot as its admin.
describe('a channel the team adds', () => {
  it('is refused with a bad name, a zone of the brand, an unknown place or without the bot as admin', async () => {
    const admin = deps(true);
    expect(await saveChannel(admin, 'no spaces', input)).toEqual({
      ok: false,
      error: 'channels.invalid_input',
    });
    expect(await saveChannel(admin, 'zone_samarqand', input)).toEqual({
      ok: false,
      error: 'channels.invalid_input',
    });
    expect(await saveChannel(admin, 'team_channel', { ...input, places: ['9999999'] })).toEqual({
      ok: false,
      error: 'locations.not_found',
    });
    expect(await saveChannel(deps(false), 'team_channel', input)).toEqual({
      ok: false,
      error: 'channels.bot_not_admin',
    });
  });

  it('is saved after the zones of the brand, and removed', async () => {
    const admin = deps(true);
    expect((await saveChannel(admin, 'team_channel', input)).ok).toBe(true);
    expect((await allChannels(admin)).map((c) => [c.username, c.fixed])).toEqual([
      ['zone_samarqand', true],
      ['team_channel', false],
    ]);
    expect(await removeChannel(admin, 'team_channel')).toBe(true);
    expect((await allChannels(admin)).map((c) => c.username)).toEqual(['zone_samarqand']);
  });
});
