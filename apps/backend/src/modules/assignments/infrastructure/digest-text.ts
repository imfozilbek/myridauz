import { tashkentDayStart } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { bold } from '../../../shared/telegram/html';
import type { DayNumbers, DigestRow } from '../application/digest';

const { t, formatDate } = createI18n(DEFAULT_LOCALE);
// Noon of the day: its date is the same in any time zone of the formatter.
const NOON_MS = 12 * 60 * 60 * 1000;

// The summary of the day for the owner (G68, docs/122, mockup g68/4): the numbers of the day, a line
// per member, the unanswered questions, the people who came from a channel.
export function digestText(
  day: string,
  rows: readonly DigestRow[],
  numbers: DayNumbers,
  nameOf: (id: number) => string,
): string {
  const date = formatDate(new Date(tashkentDayStart(day) + NOON_MS));
  const lines = rows.map((row) =>
    t('bot.digest.line', {
      name: nameOf(row.memberId),
      answered: String(row.answered),
      total: String(row.total),
      applications: String(row.applications),
    }),
  );
  const open = rows.reduce((sum, row) => sum + row.total - row.answered, 0);
  const tail = open > 0 ? [t('bot.digest.open', { count: String(open) })] : [];
  const counts = {
    people: String(numbers.newUsers),
    trips: String(numbers.trips),
    bookings: String(numbers.bookings),
  };
  return [
    bold(t('bot.summary.title', { date })),
    t('bot.summary.numbers', counts),
    '',
    bold(t('bot.summary.team')),
    ...lines,
    ...tail,
    '',
    t('bot.summary.channels', { count: String(numbers.fromChannels) }),
  ].join('\n');
}
