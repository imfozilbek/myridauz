import { TIME_ZONE, type Locale } from './config';
import type { MessageValues } from './format-message';
import type { TranslationKey } from './messages';

type Translate = (key: TranslationKey, values?: MessageValues) => string;

// Webviews often ship Intl without Uzbek data ("90,000", "M09 30"), so names of months
// and weekdays and the thousands and decimal separators come from the catalog (docs/13, docs/25).
export function createFormatters(locale: Locale, t: Translate) {
  const number = new Intl.NumberFormat(locale);
  // Only digits are read from these parts, so they do not depend on locale data.
  const day = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: TIME_ZONE,
  });
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  });
  const dayParts = (value: Date) => {
    const parts = Object.fromEntries(day.formatToParts(value).map((part) => [part.type, Number(part.value)]));
    const [year = 0, month = 0, date = 0] = [parts.year, parts.month, parts.day];
    return { month, day: date, weekday: new Date(Date.UTC(year, month - 1, date)).getUTCDay() };
  };
  return {
    formatNumber: (value: number) =>
      number
        .formatToParts(value)
        .map((part) =>
          part.type === 'group'
            ? t('common.format.thousands')
            : part.type === 'decimal'
              ? t('common.format.decimal')
              : part.value,
        )
        .join(''),
    formatDate: (value: Date) => {
      const parts = dayParts(value);
      return t('common.format.date', { day: parts.day, month: parts.month });
    },
    formatTime: (value: Date) => time.format(value),
    formatWeekday: (value: Date) => t('common.format.weekday', { weekday: dayParts(value).weekday }),
  };
}
