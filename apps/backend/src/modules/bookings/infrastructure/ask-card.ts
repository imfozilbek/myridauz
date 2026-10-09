import type { BrandConfig } from '@platform/brands';
import { SHEET_LINK, type BookedPlace, type Booking, type BookingStatus } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import type { Card } from '../../notifications';
import { bold, escapeHtml } from '../../../shared/telegram/html';
import { appButton } from '../../../shared/telegram/open-button';
import { driverTripCard } from '../../../shared/telegram/card-keys';

const { t, formatNumber, formatTime } = createI18n(DEFAULT_LOCALE);

// A request in the driver bot (G68, docs/122, mockup g68/3): the driver answers it right there.
// «ask:<booking id>:yes» and «ask:<booking id>:no» under it.
export const ASK_PREFIX = 'ask';
export const askCardKey = (bookingId: string) => `${ASK_PREFIX}:${bookingId}`;

// What a request became: the card says it instead of the deadline, without buttons.
const OUTCOMES: Partial<Record<BookingStatus, TranslationKey>> = {
  confirmed: 'bot.ask.accepted',
  completed: 'bot.ask.accepted',
  declined: 'bot.ask.declined',
  expired: 'bot.ask.expired',
  cancelled_by_passenger: 'bot.ask.withdrawn',
  cancelled_by_driver: 'bot.card.cancelled',
};
// Not the driver's own answer: the open app of the driver refreshes as well (docs/64).
const BY_OTHERS: ReadonlySet<BookingStatus> = new Set(['expired', 'cancelled_by_passenger']);

function whoLine(booking: Booking): string {
  const { firstName, rating } = booking.passenger;
  const values = { name: bold(escapeHtml(firstName)), seats: String(booking.seats) };
  return rating && rating.average !== null
    ? t('bot.ask.who', { ...values, rating: formatNumber(rating.average) })
    : t('bot.ask.whoNew', values);
}

// The area until the confirmation, the point after it (docs/70): the driver sees where to go.
const placeOf = (place: BookedPlace | null) => place?.name?.name ?? place?.area?.name;

function wayLine(booking: Booking): string[] {
  const from = booking.pitak
    ? `🚏 ${booking.pitak.name}`
    : placeOf(booking.pickup) && `🏠 ${placeOf(booking.pickup)}`;
  const to = placeOf(booking.dropoff) && `🏠 ${placeOf(booking.dropoff)}`;
  return from && to ? [escapeHtml(t('bot.ask.way', { from, to }))] : [];
}

function buttons(brand: BrandConfig, booking: Booking) {
  const chat = { name: 'chat', id: booking.chatKey };
  return [
    [
      { text: t('bot.ask.accept'), callback_data: `${askCardKey(booking.id)}:yes` },
      { text: t('bot.ask.decline'), callback_data: `${askCardKey(booking.id)}:no` },
    ],
    [
      appButton(brand, 'driver', t('bot.card.chat'), chat),
      appButton(brand, 'driver', t('bot.card.call'), chat),
    ],
    // The main screen with the sheet of this request: the sum and the commission at hand (G68).
    [appButton(brand, 'driver', t('bot.ask.open'), { name: SHEET_LINK, id: booking.id })],
  ];
}

type Facts = {
  readonly brand: BrandConfig;
  readonly chatId: number;
  // The booking as its driver sees it.
  readonly booking: Booking;
  // No sound: the night or the road (docs/122 rules 3, «Yoʻlda»).
  readonly quiet: boolean;
};

// A new request rings under the trip card; once answered or burned the same message says so.
export function askCard({ brand, chatId, booking, quiet }: Facts): Card {
  const outcome = OUTCOMES[booking.status];
  const base = { bot: 'driver' as const, chatId, key: askCardKey(booking.id) };
  const lines = [whoLine(booking), ...wayLine(booking)];
  if (outcome) {
    const text = [...lines, bold(t(outcome))].join('\n');
    return { ...base, text, editOnly: true, refresh: BY_OTHERS.has(booking.status) };
  }
  const deadline = bold(t('bot.ask.deadline', { time: formatTime(new Date(booking.expiresAt)) }));
  return {
    ...base,
    text: [...lines, deadline].join('\n'),
    markup: { inline_keyboard: buttons(brand, booking) },
    loud: !quiet,
    refresh: true,
    answers: driverTripCard(booking.trip.id),
  };
}
