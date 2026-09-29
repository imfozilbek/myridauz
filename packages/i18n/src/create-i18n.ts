import type { Locale } from './config';
import { formatMessage, type MessageValues } from './format-message';
import { createFormatters } from './formatters';
import { CATALOGS, lookup, type TranslationKey } from './messages';

export function createI18n(locale: Locale) {
  const catalog = CATALOGS[locale];
  const t = (key: TranslationKey, values?: MessageValues) =>
    formatMessage(lookup(catalog, key), locale, values);
  const formatters = createFormatters(locale, t);
  return {
    locale,
    t,
    formatDate: formatters.formatDate,
    formatTime: formatters.formatTime,
    formatWeekday: formatters.formatWeekday,
    formatNumber: formatters.formatNumber,
    formatMoney: (amount: number) => t('common.money', { amount: formatters.formatNumber(amount) }),
  };
}

export type I18n = ReturnType<typeof createI18n>;
