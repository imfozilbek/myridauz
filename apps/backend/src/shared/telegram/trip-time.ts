import type { Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t, formatTime } = createI18n(DEFAULT_LOCALE);

type Timed = Pick<Trip, 'departAt' | 'departUntil'>;

// The time of a trip in a bot or a channel: "08:00", a range "08:00 dan 10:00 gacha" (G90, docs/216).
export function tripTimeText(trip: Timed): string {
  const from = formatTime(new Date(trip.departAt));
  if (trip.departUntil === null) return from;
  return t('bot.time.range', { from, to: formatTime(new Date(trip.departUntil)) });
}

// The short time of a trip in a channel post and the board of the day: "08:00 … 10:00" (docs/216).
export function tripTimeShort(trip: Timed): string {
  const from = formatTime(new Date(trip.departAt));
  if (trip.departUntil === null) return from;
  return t('market.trip.range', { from, to: formatTime(new Date(trip.departUntil)) });
}
