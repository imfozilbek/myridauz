import account from '../locales/uz-Latn/account.json' with { type: 'json' };
import bookings from '../locales/uz-Latn/bookings.json' with { type: 'json' };
import bot from '../locales/uz-Latn/bot.json' with { type: 'json' };
import botChannel from '../locales/uz-Latn/bot-channel.json' with { type: 'json' };
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
import reviews from '../locales/uz-Latn/reviews.json' with { type: 'json' };
import share from '../locales/uz-Latn/share.json' with { type: 'json' };
import stats from '../locales/uz-Latn/stats.json' with { type: 'json' };
import subscriptions from '../locales/uz-Latn/subscriptions.json' with { type: 'json' };
import wallet from '../locales/uz-Latn/wallet.json' with { type: 'json' };
import way from '../locales/uz-Latn/way.json' with { type: 'json' };
import type { Locale } from './config';

// uz-Latn is the reference: its keys are the only valid keys (docs/13).
const REFERENCE = {
  account,
  bookings,
  // One namespace in two files of at most 150 lines (docs/11): the channel posts apart.
  bot: { ...bot, ...botChannel },
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
  reviews,
  share,
  stats,
  subscriptions,
  wallet,
  way,
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
