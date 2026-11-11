import type { Locale } from './config';
import { formatMessage, type MessageValues } from './format-message';
import { createFormatters } from './formatters';
import { messageOf, type TranslationKey } from './messages';
import { oneAlphabet, placeIn, shownValues } from './shown-text';

export function createI18n(locale: Locale) {
  const t = (key: TranslationKey, values?: MessageValues) =>
    oneAlphabet(locale, formatMessage(messageOf(locale, key), locale, shownValues(locale, values)));

  const formatters = createFormatters(locale, t);
  return {
    locale,
    t,
    placeName: (name: string) => placeIn(locale, name),
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
