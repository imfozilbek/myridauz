import { CHANNEL_USERNAME, channelInputSchema, type Channel } from '@platform/contracts';
import type { ChannelCoverage } from '../domain/route-channels';

export type TeamChannel = ChannelCoverage & { readonly title: string; readonly link: string };
// A channel the team added (docs/63): a public one, known by its name.
export type PublicChannel = {
  readonly username: string;
  readonly title: string;
  readonly places: readonly string[];
};
export type TeamChannelStore = {
  list(): Promise<PublicChannel[]>;
  save(channel: PublicChannel, now: number): Promise<void>;
  remove(username: string): Promise<boolean>;
};

// A public channel as the bot and a person know it.
const publicOf = ({ username, title, places }: PublicChannel): Channel => ({
  chat: `@${username}`,
  title,
  places: [...places],
  link: `https://t.me/${username}`,
  fixed: false,
});

export type TeamChannelsDeps = {
  // The channels of the directions of the brand config (docs/176): changed only in the code.
  readonly fixed: readonly TeamChannel[];
  readonly titleOf: (placeId: string) => string | undefined;
  readonly store: TeamChannelStore;
  // Whether the bot of the posts can post there: it must be an admin of the channel.
  readonly botIsAdmin: (chat: string) => Promise<boolean>;
  readonly now: () => number;
};

type ChannelError = 'channels.invalid_input' | 'locations.not_found' | 'channels.bot_not_admin';
type Result = { ok: true; value: Channel } | { ok: false; error: ChannelError };

const fixedOf = (deps: TeamChannelsDeps): Channel[] =>
  deps.fixed.map(({ chat, title, places, link }) => ({
    chat,
    title,
    places: [...places],
    link,
    fixed: true,
  }));

// Every channel a trip can go to: the channels of the brand first, then the team's (docs/63).
export async function allChannels(deps: TeamChannelsDeps): Promise<Channel[]> {
  return [...fixedOf(deps), ...(await deps.store.list()).map(publicOf)];
}

// The team adds or changes a channel: known places only, and the bot must already be its admin.
export async function saveChannel(deps: TeamChannelsDeps, username: string, input: unknown): Promise<Result> {
  const parsed = channelInputSchema.safeParse(input);
  const fixed = deps.fixed.some((channel) => channel.chat === `@${username}`);
  if (!parsed.success || !CHANNEL_USERNAME.test(username) || fixed)
    return { ok: false, error: 'channels.invalid_input' };
  const places = [...new Set(parsed.data.places)];
  if (places.some((place) => deps.titleOf(place) === undefined))
    return { ok: false, error: 'locations.not_found' };
  if (!(await deps.botIsAdmin(`@${username}`))) return { ok: false, error: 'channels.bot_not_admin' };
  const channel = { username, title: parsed.data.title, places };
  await deps.store.save(channel, deps.now());
  return { ok: true, value: publicOf(channel) };
}

export async function removeChannel(deps: TeamChannelsDeps, username: string): Promise<boolean> {
  return deps.store.remove(username);
}
