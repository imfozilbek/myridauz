import type { BrandConfig } from '@platform/brands';
import {
  MY_TRIP_LINK,
  onTheWay,
  tashkentDate,
  tripBookLink,
  VIA_DRIVER,
  type Booking,
  type Trip,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card } from '../../notifications';
import { endNames, type Places } from '../../../shared/places/end-names';
import { bold, escapeHtml, italic, quote } from '../../../shared/telegram/html';
import { appButton } from '../../../shared/telegram/open-button';
import { whenLines } from './card-when';
import { roadLines } from './road-order';

const { t, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

// The live card of a trip in the driver bot: one per trip, on top of the chat (G68, mockup g68/3).
export const driverCardKey = (tripId: string) => `trip:${tripId}`;

type Stage = 'published' | 'onWay' | 'arrived' | 'cancelled';

function stageOf(trip: Trip, now: number): Stage {
  if (trip.status === 'cancelled') return 'cancelled';
  if (trip.status === 'completed' || trip.arrivedAt !== null) return 'arrived';
  return onTheWay(trip, now) ? 'onWay' : 'published';
}

const riding = (booking: Booking) =>
  (booking.status === 'confirmed' || booking.status === 'completed') && booking.noShowAt === null;

function header(trip: Trip, stage: Stage, bookings: readonly Booking[]): string {
  const riders = bookings.filter(riding);
  if (stage === 'cancelled') return bold(t('bot.dcard.cancelled'));
  if (stage === 'arrived') return bold(t('bot.dcard.arrived'));
  if (stage === 'onWay') {
    // The departure, every pickup and every dropoff: «3 / 5» once both are in the car.
    const done = 1 + riders.filter((booking) => booking.boardedAt !== null).length;
    const left = riders.filter((booking) => booking.arrivedAt !== null).length;
    return bold(t('bot.dcard.onWay', { done: String(done + left), steps: String(1 + 2 * riders.length) }));
  }
  const taken = riders.reduce((sum, booking) => sum + booking.seats, 0);
  return bold(t('bot.dcard.published', { taken: String(taken), seats: String(trip.seats) }));
}

// 🟢 where from with the pitak, when the driver takes people there, and 🔴 where to (docs/121).
function endBlocks(trip: Trip, places: Places): string[] {
  const names = endNames(trip.from, trip.to, places);
  const pitak = trip.pitak && trip.pickupMode !== 'door' ? [`🚏 ${escapeHtml(trip.pitak.name)}`] : [];
  return [quote([`🟢 ${names.from}`, ...pitak]), quote([`🔴 ${names.to}`])];
}

// Who asked and who is confirmed: the driver sees at once who still waits for an answer.
function passengerLines(bookings: readonly Booking[]): string[] {
  const shown = bookings.filter((booking) => booking.status === 'requested' || riding(booking));
  if (shown.length === 0) return [];
  const lines = shown.map((booking, index) =>
    t('bot.dcard.passenger', {
      index: String(index + 1),
      name: escapeHtml(booking.passenger.firstName),
      seats: String(booking.seats),
      state: booking.status === 'requested' ? t('bot.dcard.waiting') : '✅',
    }),
  );
  return [quote([t('bot.dcard.passengers'), ...lines])];
}

function buttons(brand: BrandConfig, trip: Trip, stage: Stage) {
  const open = (text: string) => appButton(brand, 'driver', text, { name: MY_TRIP_LINK, id: trip.id });
  const link = tripBookLink(brand.bots.passenger, trip.id, VIA_DRIVER);
  const share = { text: t('bot.dcard.share'), url: `https://t.me/share/url?url=${encodeURIComponent(link)}` };
  if (stage === 'published') return [[open(t('bot.dcard.open')), share]];
  if (stage === 'onWay') return [[open(t('bot.dcard.arrive'))]];
  return stage === 'arrived' ? [[open(t('bot.dcard.open'))]] : null;
}

type Facts = {
  readonly brand: BrandConfig;
  readonly chatId: number;
  readonly trip: Trip;
  // The bookings of the trip as its driver sees them.
  readonly bookings: readonly Booking[];
  readonly places: Places;
  readonly now: number;
};

// The card shows the trip now: published with its passengers, the order of the road on the day
// of the trip, arrived or cancelled. On the road it says that the bot keeps quiet (docs/122).
export function driverCard({ brand, chatId, trip, bookings, places, now }: Facts): Card {
  const stage = stageOf(trip, now);
  const onWay = stage === 'onWay';
  const tripDay = onWay || tashkentDate(trip.departAt) === tashkentDate(now);
  const people = tripDay ? roadLines(bookings.filter(riding)) : passengerLines(bookings);
  const text = [
    header(trip, stage, bookings),
    ...whenLines(trip, onWay, now),
    ...endBlocks(trip, places),
    ...people,
    t('bot.dcard.price', { price: bold(formatMoney(trip.price)) }),
    ...(onWay ? [italic(t('bot.dcard.quiet'))] : []),
  ].join('\n');
  const keyboard = buttons(brand, trip, stage);
  return {
    bot: 'driver',
    chatId,
    key: driverCardKey(trip.id),
    text,
    footer: italic(t('bot.card.updated', { time: formatTime(new Date(now)) })),
    ...(keyboard ? { markup: { inline_keyboard: keyboard } } : {}),
    pin: stage === 'published' || onWay,
  };
}
