import type { BrandConfig } from '@platform/brands';
import { TASHKENT_CITY, type Pain, type WaitlistRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { FRIEND_PREFIX } from '../domain/sources';

const { t } = createI18n(DEFAULT_LOCALE);

// The two ends of a route of the list: always Toshkent shahri first (docs/181). Plain names: the
// card escapes them for its HTML.
export const routeNames = (region: string, places: Places) => ({
  from: places.get(TASHKENT_CITY)?.name ?? TASHKENT_CITY,
  to: places.get(region)?.name ?? region,
});

// The link of «Doʻstimni chaqiraman»: the main bot with the friend mark of the person (docs/116).
export const friendLink = (brand: BrandConfig, code: string) =>
  `https://t.me/${brand.bots.main}?start=${FRIEND_PREFIX}${code}`;

type Invited = { readonly role: WaitlistRole; readonly pains: readonly Pain[]; readonly region: string };

// The message to a friend speaks of the first pain of the person (docs/182).
export function inviteText(brand: BrandConfig, record: Invited, places: Places): string {
  const { from, to } = routeNames(record.region, places);
  const pain = record.pains[0] ?? 'chats';
  return [
    t(`bot.main.friend.${record.role}.${pain}` as TranslationKey),
    t('bot.main.friend.rest', { brand: brand.name, route: `${from} ↔ ${to}` }),
  ].join(' ');
}
