import { arrivalAt, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { bold, escapeHtml } from '../../../shared/telegram/html';
import { tripTimeShort } from '../../../shared/telegram/trip-time';
import { fromLine, groupMark, inScript, placeOf, type GroupLook } from './group-look';
import type { Post } from './post-life';
import { dayLabel, timeOf } from './post-parts';

const { t, formatNumber } = createI18n(DEFAULT_LOCALE);
// A car with this many free seats is «BOʻSH {car}», as the group's own cards say (owner, 25.10.2026).
export const EMPTY_SEATS = 4;

function pickupOf(trip: Trip): string {
  const pitak = trip.pitak ? escapeHtml(trip.pitak.name) : null;
  if (trip.pickupMode === 'door' || !pitak) return t('bot.group.door');
  return t(trip.pickupMode === 'pitak' ? 'bot.group.pitak' : 'bot.group.both', { pitak });
}

// «🚗 BOʻSH Gentra · Yakkabogʻga» with the amber R of the Mini App.
function head(trip: Trip, places: Places, cards: GroupLook['cards']): string {
  const to = placeOf(trip.to, places);
  const line =
    trip.seatsLeft >= EMPTY_SEATS
      ? t('bot.group.empty', { car: escapeHtml(trip.driver.car.model), ...to })
      : t('bot.group.takes', to);
  return `${bold(line)} ${groupMark(cards, 'trip')}`;
}

function checkedLine(trip: Trip): string {
  const { average } = trip.driver.rating;
  const rating =
    average === null
      ? t('bot.channel.newDriver')
      : t('bot.channel.rating', { average: formatNumber(average) });
  return t('bot.group.checked', { rating });
}

// «🕒 Bugun 16:00 da yoʻlga chiqadi, ≈ 23:05 da yetadi»; a range has no arrival (docs/216).
function whenLine(trip: Trip, now: number): string {
  const day = dayLabel(trip.departAt, now);
  if (trip.departUntil !== null) return t('bot.group.whenRange', { day, time: tripTimeShort(trip) });
  const arrive = timeOf(arrivalAt(trip.departAt, trip.km));
  return t('bot.group.when', { day, time: timeOf(trip.departAt), arrive });
}

function seatsLine(trip: Trip): string {
  const price = formatNumber(trip.price);
  if (trip.seatsLeft === 1) return t('bot.group.lastSeat', { price });
  return t('bot.group.seats', { seats: String(trip.seatsLeft), price });
}

// A trip of the Mini App in a direction group, in the look of the group's own cards (owner,
// 05.11.2026, mockup of docs/223): the head with the R, the check, from and to, the time, the
// seats and the price; one button books it. No phone: contacts stay in Rida (docs/07).
export function groupTripPost(look: GroupLook, trip: Trip, places: Places, now: number, book: string): Post {
  const text = [
    head(trip, places, look.cards),
    checkedLine(trip),
    fromLine(trip.from, places, pickupOf(trip)),
    t('bot.group.to', placeOf(trip.to, places)),
    whenLine(trip, now),
    seatsLine(trip),
    ...(trip.woman ? [t('bot.channel.woman')] : []),
  ].join('\n');
  const markup = { inline_keyboard: [[{ text: t('bot.group.book'), url: book }]] };
  // The model of the car stays as it is written on the car (owner, 25.10.2026).
  return inScript(look.cards, { text, markup }, [trip.driver.car.model]);
}
