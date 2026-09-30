import { CHANNEL_USERNAME, channelInputSchema, type Channel } from '@platform/contracts';
import type { ChannelCoverage } from '../domain/route-channels';

export type TeamChannel = ChannelCoverage & { readonly title: string };
export type TeamChannelStore = {
  list(): Promise<TeamChannel[]>;
  save(channel: TeamChannel, now: number): Promise<void>;
  remove(username: string): Promise<boolean>;
};

export type TeamChannelsDeps = {
  // The 13 region channels of the brand config: region SOATO code → username (docs/15).
  readonly fixed: Readonly<Record<string, string>>;
  readonly titleOf: (placeId: string) => string | undefined;
  readonly store: TeamChannelStore;
  // Whether the passenger bot can post there: it must be an admin of the channel.
  readonly botIsAdmin: (username: string) => Promise<boolean>;
  readonly now: () => number;
};

type ChannelError = 'channels.invalid_input' | 'locations.not_found' | 'channels.bot_not_admin';
type Result = { ok: true; value: Channel } | { ok: false; error: ChannelError };

const fixedOf = (deps: TeamChannelsDeps): Channel[] =>
  Object.entries(deps.fixed).map(([place, username]) => ({
    username,
    title: deps.titleOf(place) ?? username,
    places: [place],
    fixed: true,
  }));

// Every channel a trip can go to: the region channels first, then the team's (docs/63).
export async function allChannels(deps: TeamChannelsDeps): Promise<Channel[]> {
  const team = await deps.store.list();
  return [
    ...fixedOf(deps),
    ...team.map((channel) => ({ ...channel, places: [...channel.places], fixed: false })),
  ];
}

// The team adds or changes a channel: known places only, and the bot must already be its admin.
export async function saveChannel(deps: TeamChannelsDeps, username: string, input: unknown): Promise<Result> {
  const parsed = channelInputSchema.safeParse(input);
  const fixed = Object.values(deps.fixed).includes(username);
  if (!parsed.success || !CHANNEL_USERNAME.test(username) || fixed)
    return { ok: false, error: 'channels.invalid_input' };
  const places = [...new Set(parsed.data.places)];
  if (places.some((place) => deps.titleOf(place) === undefined))
    return { ok: false, error: 'locations.not_found' };
  if (!(await deps.botIsAdmin(username))) return { ok: false, error: 'channels.bot_not_admin' };
  const channel = { username, title: parsed.data.title, places };
  await deps.store.save(channel, deps.now());
  return { ok: true, value: { ...channel, fixed: false } };
}

export async function removeChannel(deps: TeamChannelsDeps, username: string): Promise<boolean> {
  return deps.store.remove(username);
}
