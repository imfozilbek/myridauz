import type { TeamChannel, TeamChannelStore } from '../application/team';

type Row = { username: string; title: string; places: string };

// The channels the team added (docs/63): places are kept as a JSON list of SOATO codes.
export const d1TeamChannels = (db: D1Database): TeamChannelStore => ({
  list: async () => {
    const { results } = await db.prepare('SELECT * FROM team_channels ORDER BY title').all<Row>();
    return results.map((row) => ({ ...row, places: JSON.parse(row.places) as string[] }));
  },
  save: async (channel, now) => {
    await db
      .prepare(
        'INSERT OR REPLACE INTO team_channels (username, title, places, updated_at) VALUES (?, ?, ?, ?)',
      )
      .bind(channel.username, channel.title, JSON.stringify(channel.places), now)
      .run();
  },
  remove: async (username) => {
    const { meta } = await db.prepare('DELETE FROM team_channels WHERE username = ?').bind(username).run();
    return meta.changes > 0;
  },
});

// In memory: tests and local runs without D1.
export function createMemoryTeamChannels(): TeamChannelStore {
  const kept = new Map<string, TeamChannel>();
  return {
    list: async () => [...kept.values()].sort((a, b) => a.title.localeCompare(b.title)),
    save: async (channel) => void kept.set(channel.username, channel),
    remove: async (username) => kept.delete(username),
  };
}
