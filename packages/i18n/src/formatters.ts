import { TIME_ZONE, type Locale } from './config';

// Formats come from Intl, never by hand (docs/13, docs/25): 150 000, 27-sentabr, 14:30.
export function createFormatters(locale: Locale) {
  const number = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: TIME_ZONE });
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  });
  return {
    formatNumber: (value: number) => number.format(value),
    formatDate: (value: Date) => date.format(value),
    formatTime: (value: Date) => time.format(value),
  };
}
