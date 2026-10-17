import type { AdLink, AdLinkInput, WaitlistSwitch } from '@platform/contracts';
import { randomCode } from '../../../shared/codes/random-code';
import { AD_CODE_LENGTH, AD_PREFIX } from '../domain/sources';
import type { AdRow, AdStore, SwitchStore } from './ports';

export type AdDeps = {
  readonly ads: AdStore;
  readonly switches: SwitchStore;
  // The link into a bot with the mark of the ad (docs/184): the main bot by its Start, a bot of the
  // trips straight into its Mini App, where the registration keeps the mark (docs/116).
  readonly botLink: (target: AdRow['target'], code: string) => string;
  // The chats a channel ad may lead to: the main channel and the channels of the directions.
  readonly channels: ReadonlySet<string>;
  // The own invite link the bot of the channels makes, named by the ad; null when it may not.
  readonly invite: (chat: string, name: string) => Promise<string | null>;
  readonly journal: (by: number, subject: string, action: string) => Promise<void>;
  readonly now: () => number;
};

const linkOf = async (deps: AdDeps, ad: AdRow): Promise<AdLink> => ({
  code: ad.code,
  link: ad.invite ?? deps.botLink(ad.target, ad.code),
  target: ad.target,
  channel: ad.channel,
  place: ad.place,
  name: ad.name,
  price: ad.price,
  days: ad.days,
  top: ad.top,
  pin: ad.pin,
  at: ad.at,
  result: await deps.ads.result(ad),
});

// «Havola yaratish» (docs/184): a new mark; a channel ad gets its own invite link of the channel.
export async function createAd(
  deps: AdDeps,
  input: AdLinkInput,
  by: number,
): Promise<AdLink | 'invalid' | 'not_admin'> {
  const chat = input.channel;
  if (chat !== null && !deps.channels.has(chat)) return 'invalid';
  const invite = chat === null ? null : await deps.invite(chat, input.name);
  if (chat !== null && invite === null) return 'not_admin';
  const { target, place, name, price, days, top, pin } = input;
  const ad = {
    code: `${AD_PREFIX}${randomCode(AD_CODE_LENGTH)}`,
    target,
    channel: chat,
    invite,
    place,
    name,
    price,
    days,
    top,
    pin,
    at: deps.now(),
  };
  await deps.ads.add(ad, by);
  await deps.journal(by, ad.code, 'ad');
  return linkOf(deps, ad);
}

export const listAds = async (deps: AdDeps) =>
  Promise.all((await deps.ads.all()).map((ad) => linkOf(deps, ad)));

export async function oneAd(deps: AdDeps, code: string): Promise<AdLink | null> {
  const ad = await deps.ads.find(code);
  return ad ? linkOf(deps, ad) : null;
}

// A join or a leave the bot of the channels heard (chat_member): a join by the invite link of an ad
// counts for it; a leave of that channel ends the stay (docs/184).
export type ChannelChange = {
  readonly chat: string;
  readonly userId: number;
  readonly member: boolean;
  readonly at: number;
  readonly invite: string | null;
};
export async function heardChange(ads: AdStore, change: ChannelChange): Promise<void> {
  if (!change.member) return ads.left(change.userId, change.chat, change.at);
  const code = change.invite === null ? null : await ads.inviteOf(change.invite);
  if (code) await ads.joined(code, change.userId, change.chat, change.at);
}

// «Roʻyxatga yozish» of «Boshqaruv» (docs/181): the state, when it changed, how many ad links.
export async function readSwitch(deps: AdDeps): Promise<WaitlistSwitch> {
  const [state, links] = await Promise.all([deps.switches.read(), deps.ads.count()]);
  return { open: state.open, at: state.at, links };
}

export async function setSwitch(deps: AdDeps, open: boolean, by: number): Promise<WaitlistSwitch> {
  await deps.switches.set(open, by, deps.now());
  await deps.journal(by, 'switch', open ? 'list_open' : 'list_close');
  return readSwitch(deps);
}
