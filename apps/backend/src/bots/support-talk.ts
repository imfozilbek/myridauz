import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { HistoryEntry } from '../modules/support';
import type { Media } from '../shared/telegram/telegram-files';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);
// A Telegram message holds 4096 signs: a long talk goes in parts.
const PART = 4000;

// The line of a voice message or a photo, in a copy and in the talk (G32).
export const mediaLabel = (kind: Media['kind'] | 'text') =>
  kind === 'voice' ? t('bot.support.voice') : kind === 'photo' ? t('bot.support.photo') : '';

// The text of one message with its media line on top.
const withLabel = (kind: Media['kind'] | 'text', text: string | undefined) =>
  [mediaLabel(kind), text].filter(Boolean).join('\n');

// The whole support talk of a person for a team member (G32), oldest first, in parts.
export function talkParts(talk: readonly HistoryEntry[]): string[] {
  if (talk.length === 0) return [t('bot.support.historyEmpty')];
  const name = talk.find((entry) => entry.author === 'person')?.name ?? '';
  const lines = talk.map((entry) => {
    const when = `${formatDate(new Date(entry.at))} ${formatTime(new Date(entry.at))}`;
    return `${when} ${entry.name}: ${withLabel(entry.kind, entry.text)}`;
  });
  // The name only: the Telegram ID of a person never goes to a bot message (lesson №136).
  const parts = [t('bot.support.historyTitle', { name })];
  for (const line of lines) {
    const last = parts.length - 1;
    if ((parts[last] ?? '').length + line.length + 2 > PART) parts.push(line);
    else parts[last] = `${parts[last] ?? ''}\n\n${line}`;
  }
  return parts;
}
