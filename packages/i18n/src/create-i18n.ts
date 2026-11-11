import type { Locale } from './config';
import { toCyrillic } from './cyrillic';
import { formatMessage, type MessageValues } from './format-message';
import { createFormatters } from './formatters';
import { messageOf, type TranslationKey } from './messages';

// The values that name a place are shown in the alphabet of the text even when they were kept in
// Latin: an older trip, a name of the map or of the team (G98, docs/228). The names of people, the
// cars, the plates and the brand stay as they were written.
const PLACE_VALUES = new Set([
  'from',
  'to',
  'place',
  'route',
  'region',
  'area',
  'pitak',
  'city',
  'zone',
  'pickup',
  'drop',
  'direction',
]);

function shownValues(locale: Locale, values: MessageValues | undefined): MessageValues | undefined {
  if (locale === 'uz-Latn' || values === undefined) return values;
  const entries = Object.entries(values).map(([name, value]) => [
    name,
    typeof value === 'string' && PLACE_VALUES.has(name) ? toCyrillic(value) : value,
  ]);
  return Object.fromEntries(entries) as MessageValues;
}

export function createI18n(locale: Locale) {
  const t = (key: TranslationKey, values?: MessageValues) =>
    formatMessage(messageOf(locale, key), locale, shownValues(locale, values));

  const formatters = createFormatters(locale, t);
  return {
    locale,
    t,
    formatDate: formatters.formatDate,
    formatShortDate: formatters.formatShortDate,
    formatTime: formatters.formatTime,
    formatWeekday: formatters.formatWeekday,
    formatNumber: formatters.formatNumber,
    formatRating: formatters.formatRating,
    formatMoney: (amount: number) => t('common.money', { amount: formatters.formatNumber(amount) }),
  };
}

export type I18n = ReturnType<typeof createI18n>;
