import type { BrandConfig } from '@platform/brands';
import { BOOKING_LINK, formatPlate, type Booking, type BookingStatus } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card } from '../../notifications';
import { endNames, type Places } from '../../../shared/places/end-names';
import { bold, escapeHtml, italic, mono, quote } from '../../../shared/telegram/html';
import { passengerTripCard } from '../../../shared/telegram/card-keys';
import { appButton } from '../../../shared/telegram/open-button';
import { whenLines } from './card-when';
import { backButton, findOtherButton } from './find-other';

const { t, formatMoney, formatTime, formatNumber } = createI18n(DEFAULT_LOCALE);

// The live card of a seat in the passenger bot: one per booking (G68, docs/122, mockup g68/2).

type Stage = 'waiting' | 'confirmed' | 'onWay' | 'arrived' | 'ended';
const ENDED: Partial<Record<BookingStatus, 'declined' | 'expired' | 'cancelledByDriver' | 'cancelled'>> = {
  declined: 'declined',
  expired: 'expired',
  cancelled_by_driver: 'cancelledByDriver',
  cancelled_by_passenger: 'cancelled',
};

function stageOf(booking: Booking): Stage {
  // «Kelmadi» of the driver ends the seat too, though the booking stays confirmed (G63).
  if (ENDED[booking.status] || booking.noShowAt !== null) return 'ended';
  // The passenger said «Yetib keldim», or the driver «Yetib keldik», or the trip is over.
  const { trip } = booking;
  if (booking.status === 'completed' || booking.arrivedAt !== null) return 'arrived';
  if (trip.arrivedAt !== null || trip.status === 'completed') return 'arrived';
  if (booking.boardedAt !== null) return 'onWay';
  return booking.status === 'confirmed' ? 'confirmed' : 'waiting';
}

const STAGE_KEYS = {
  waiting: 'bot.card.waiting',
  confirmed: 'bot.card.confirmed',
  onWay: 'bot.card.onWay',
  arrived: 'bot.card.arrived',
} as const;

function statusLine(booking: Booking, stage: Stage): string {
  if (booking.noShowAt !== null) return bold(t('bot.card.noShow'));
  const ended = ENDED[booking.status];
  if (ended || stage === 'ended') return bold(t(`bot.card.${ended ?? 'cancelled'}`));
  return bold(t(STAGE_KEYS[stage]));
}

// 🟢 where from and 🔴 where to, the full ladder for the person's own seat (docs/121).
function endBlocks(booking: Booking, places: Places): string[] {
  const names = endNames(booking.trip.from, booking.trip.to, places);
  const pickup = booking.pitak
    ? `🚏 ${escapeHtml(booking.pitak.name)}`
    : booking.pickup?.name && `🏠 ${escapeHtml(booking.pickup.name.name)}`;
  const dropoff = booking.dropoff?.name && `🏠 ${escapeHtml(booking.dropoff.name.name)}`;
  return [
    quote([`🟢 ${names.from}`, ...(pickup ? [pickup] : [])]),
    quote([`🔴 ${names.to}`, ...(dropoff ? [dropoff] : [])]),
  ];
}

// The driver and the car; the plate only after the confirmation, in monospace to compare by eye.
function driverBlock(booking: Booking): string {
  const { firstName, car, rating } = booking.trip.driver;
  const paint = t(`drivers.color.${car.color}`).toLocaleLowerCase();
  const carName = escapeHtml(`${car.model}, ${paint}`);
  const name = escapeHtml(firstName);
  const line =
    rating.average === null
      ? t('bot.card.newDriver', { name, car: carName })
      : t('bot.card.driver', { name, rating: formatNumber(rating.average), car: carName });
  const confirmed = booking.status === 'confirmed' || booking.status === 'completed';
  return quote(confirmed && booking.plate ? [line, mono(formatPlate(booking.plate))] : [line]);
}

function buttons(brand: BrandConfig, booking: Booking, stage: Stage, now: number) {
  const open = (text: string) => appButton(brand, 'passenger', text, { name: BOOKING_LINK, id: booking.id });
  const chat = { name: 'chat', id: booking.chatKey };
  const talk = [
    appButton(brand, 'passenger', t('bot.card.chat'), chat),
    appButton(brand, 'passenger', t('bot.card.call'), chat),
  ];
  if (stage === 'ended') return [[findOtherButton(brand, booking)]];
  if (stage === 'confirmed') return [talk, [open(t('bot.card.share'))]];
  if (stage === 'onWay') return [talk, [open(t('bot.card.arrivedButton'))]];
  if (stage === 'arrived') return [[backButton(brand, booking, now)]];
  return [[open(t('bot.open'))]];
}

type Facts = {
  readonly brand: BrandConfig;
  readonly chatId: number;
  readonly booking: Booking;
  readonly places: Places;
  readonly now: number;
};

// The card shows where the seat stands now: waiting, confirmed, on the road, arrived or ended.
export function passengerCard({ brand, chatId, booking, places, now }: Facts): Card {
  const stage = stageOf(booking);
  const price = bold(formatMoney(booking.price * booking.seats));
  const text = [
    statusLine(booking, stage),
    ...whenLines(booking.trip, stage === 'onWay', now),
    ...endBlocks(booking, places),
    driverBlock(booking),
    t('bot.card.seats', { seats: String(booking.seats), price }),
  ].join('\n');
  return {
    bot: 'passenger',
    chatId,
    key: passengerTripCard(booking.id),
    text,
    footer: italic(t('bot.card.updated', { time: formatTime(new Date(now)) })),
    markup: { inline_keyboard: buttons(brand, booking, stage, now) },
    pin: stage === 'waiting' || stage === 'confirmed' || stage === 'onWay',
  };
}
