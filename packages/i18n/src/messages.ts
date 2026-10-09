import account from '../locales/uz-Latn/account.json' with { type: 'json' };
import bookings from '../locales/uz-Latn/bookings.json' with { type: 'json' };
import bot from '../locales/uz-Latn/bot.json' with { type: 'json' };
import botChannel from '../locales/uz-Latn/bot-channel.json' with { type: 'json' };
import botCard from '../locales/uz-Latn/bot-card.json' with { type: 'json' };
import botDriver from '../locales/uz-Latn/bot-driver.json' with { type: 'json' };
import botTeam from '../locales/uz-Latn/bot-team.json' with { type: 'json' };
import calls from '../locales/uz-Latn/calls.json' with { type: 'json' };
import comfort from '../locales/uz-Latn/comfort.json' with { type: 'json' };
import channels from '../locales/uz-Latn/channels.json' with { type: 'json' };
import chat from '../locales/uz-Latn/chat.json' with { type: 'json' };
import common from '../locales/uz-Latn/common.json' with { type: 'json' };
import complaints from '../locales/uz-Latn/complaints.json' with { type: 'json' };
import drivers from '../locales/uz-Latn/drivers.json' with { type: 'json' };
import driverTrip from '../locales/uz-Latn/driver-trip.json' with { type: 'json' };
import find from '../locales/uz-Latn/find.json' with { type: 'json' };
import errors from '../locales/uz-Latn/errors.json' with { type: 'json' };
import home from '../locales/uz-Latn/home.json' with { type: 'json' };
import landing from '../locales/uz-Latn/landing.json' with { type: 'json' };
import legal from '../locales/uz-Latn/legal.json' with { type: 'json' };
import market from '../locales/uz-Latn/market.json' with { type: 'json' };
import moderation from '../locales/uz-Latn/moderation.json' with { type: 'json' };
import pitaks from '../locales/uz-Latn/pitaks.json' with { type: 'json' };
import places from '../locales/uz-Latn/places.json' with { type: 'json' };
import pricing from '../locales/uz-Latn/pricing.json' with { type: 'json' };
import requests from '../locales/uz-Latn/requests.json' with { type: 'json' };
import reviews from '../locales/uz-Latn/reviews.json' with { type: 'json' };
import share from '../locales/uz-Latn/share.json' with { type: 'json' };
import sheet from '../locales/uz-Latn/sheet.json' with { type: 'json' };
import stats from '../locales/uz-Latn/stats.json' with { type: 'json' };
import subscriptions from '../locales/uz-Latn/subscriptions.json' with { type: 'json' };
import wallet from '../locales/uz-Latn/wallet.json' with { type: 'json' };
import way from '../locales/uz-Latn/way.json' with { type: 'json' };
// The meeting and the end of a trip on the driver's side (G63, docs/126, docs/129).
import driverAfter from '../locales/uz-Latn/driver-after.json' with { type: 'json' };
// The team in the admin app: «Diqqat», «Navbat» and the cases (G75, docs/120).
import team from '../locales/uz-Latn/team.json' with { type: 'json' };
import type { Locale } from './config';

// uz-Latn is the reference: its keys are the only valid keys (docs/13).
const REFERENCE = {
  account,
  bookings,
  // One namespace in files of at most 150 lines (docs/11): the channel posts and the cards apart.
  bot: { ...bot, ...botChannel, ...botCard, ...botDriver, ...botTeam },
  calls,
  comfort,
  channels,
  chat,
  common,
  complaints,
  drivers,
  driverTrip,
  find,
  errors,
  home,
  landing,
  legal,
  market,
  moderation,
  pitaks,
  places,
  pricing,
  // The board of requests of a driver and its windows (G64, docs/118 path 7).
  requests,
  reviews,
  share,
  // The sheet of the open Mini App: the bot calls, the app answers (G68, docs/122).
  sheet,
  stats,
  subscriptions,
  wallet,
  way,
  driverAfter,
  team,
};
type Namespaces = typeof REFERENCE;
export type TranslationKey = {
  [N in keyof Namespaces]: `${N & string}.${keyof Namespaces[N] & string}`;
}[keyof Namespaces];

type Catalog = Readonly<Record<string, Readonly<Record<string, string>>>>;
export const CATALOGS: Readonly<Record<Locale, Catalog>> = { 'uz-Latn': REFERENCE };

export function lookup(catalog: Catalog, key: TranslationKey): string {
  const [namespace = '', ...rest] = key.split('.');
  const message = catalog[namespace]?.[rest.join('.')];
  if (message === undefined) throw new Error(`i18n.missing_key:${key}`);
  return message;
}
