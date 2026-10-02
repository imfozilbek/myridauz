import { tashkentDayStart } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { DigestRow } from '../application/digest';

const { t, formatDate } = createI18n(DEFAULT_LOCALE);
// Noon of the day: its date is the same in any time zone of the formatter.
const NOON_MS = 12 * 60 * 60 * 1000;

// The digest of one day for the team (docs/92): a line per member and the unanswered questions.
export function digestText(day: string, rows: readonly DigestRow[], nameOf: (id: number) => string): string {
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
  return [t('bot.digest.title', { date }), ...lines, ...tail].join('\n');
}
