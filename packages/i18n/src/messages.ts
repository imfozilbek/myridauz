import account from '../locales/uz-Latn/account.json' with { type: 'json' };
import bot from '../locales/uz-Latn/bot.json' with { type: 'json' };
import common from '../locales/uz-Latn/common.json' with { type: 'json' };
import errors from '../locales/uz-Latn/errors.json' with { type: 'json' };
import type { Locale } from './config';

// uz-Latn is the reference: its keys are the only valid keys (docs/13).
const REFERENCE = { account, bot, common, errors };
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
