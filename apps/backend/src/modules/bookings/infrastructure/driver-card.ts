import type { BrandConfig } from '@platform/brands';
import {
  MY_TRIP_LINK,
  onTheWay,
  tashkentDate,
  tripBookLink,
  type Booking,
  type Trip,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card } from '../../notifications';
import { endNames, type Places } from '../../../shared/places/end-names';
import { bold, escapeHtml, italic, quote } from '../../../shared/telegram/html';
import { tripShareText } from '../../../shared/share/trip-text';
import { driverTripCard } from '../../../shared/telegram/card-keys';
import { appButton } from '../../../shared/telegram/open-button';
import { shareLink } from '../../../shared/telegram/share-link';
import { whenLines } from './card-when';
import { roadLines } from './road-order';

const { t, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

type Stage = 'published' | 'onWay' | 'arrived' | 'cancelled';

// On the road once the driver tapped «Yoʻlga chiqdim»: the time alone does not, as in the app
// (G91 DRV-12).
function stageOf(trip: Trip): Stage {
  if (trip.status === 'cancelled') return 'cancelled';
  if (trip.status === 'completed' || trip.arrivedAt !== null) return 'arrived';
  return trip.departedAt !== null ? 'onWay' : 'published';
}

const riding = (booking: Booking) =>
  (booking.status === 'confirmed' || booking.status === 'completed') && booking.noShowAt === null;

function header(trip: Trip, stage: Stage, bookings: readonly Booking[]): string {
  const riders = bookings.filter(riding);
  if (stage === 'cancelled') return bold(t('bot.dcard.cancelled'));
  if (stage === 'arrived') return bold(t('bot.dcard.arrived'));
  if (stage === 'onWay') {
    // The addresses still ahead: a pickup until the passenger got in, a dropoff until they arrived.
    const left = riders.reduce(
      (sum, booking) => sum + Number(booking.boardedAt === null) + Number(booking.arrivedAt === null),
      0,
    );
    return bold(left > 0 ? t('bot.dcard.onWay', { count: String(left) }) : t('bot.card.onWay'));
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

// «🔗 Havolani yuborish» while the trip has free seats: the words of the trip with the link that carries
// the driver's code (G88, docs/193).
function shareButton(brand: BrandConfig, trip: Trip, places: Places, via: string) {
  const link = tripBookLink(brand.bots.passenger, trip.id, via);
  return { text: t('bot.dcard.share'), url: shareLink(link, tripShareText(trip, places)) };
}

type Button = ReturnType<typeof shareButton>;

function buttons(brand: BrandConfig, trip: Trip, stage: Stage, share: Button | null) {
  const open = (text: string) => appButton(brand, 'driver', text, { name: MY_TRIP_LINK, id: trip.id });
  if (stage === 'published') return [[open(t('bot.dcard.open')), ...(share ? [share] : [])]];
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
  // The mark of the driver's link: the loop trip with the code (G88).
  readonly via: string;
};

// The live card of a trip in the driver bot, on top of the chat (G68, mockup g68/3). It shows the trip now: published with its passengers, the order of the road on the day
// of the trip, arrived or cancelled. On the road it says that the bot keeps quiet (docs/122).
export function driverCard({ brand, chatId, trip, bookings, places, now, via }: Facts): Card {
  const stage = stageOf(trip);
  const onWay = stage === 'onWay';
  // Its time came: the order of the road, after midnight too (G91).
  const tripDay = onWay || onTheWay(trip, now) || tashkentDate(trip.departAt) === tashkentDate(now);
  const people = tripDay ? roadLines(bookings.filter(riding)) : passengerLines(bookings);
  const text = [
    header(trip, stage, bookings),
    ...whenLines(trip, onWay, now),
    ...endBlocks(trip, places),
    ...people,
    t('bot.dcard.price', { price: bold(formatMoney(trip.price)) }),
    ...(onWay ? [italic(t('bot.dcard.quiet'))] : []),
  ].join('\n');
  // Its time came: the trip takes nobody now (onTheWay), nothing to share.
  const free = stage === 'published' && !onTheWay(trip, now) && trip.seatsLeft > 0;
  const keyboard = buttons(brand, trip, stage, free ? shareButton(brand, trip, places, via) : null);
  return {
    bot: 'driver',
    chatId,
    key: driverTripCard(trip.id),
    text,
    footer: italic(t('bot.card.updated', { time: formatTime(new Date(now)) })),
    ...(keyboard ? { markup: { inline_keyboard: keyboard } } : {}),
    pin: stage === 'published' || onWay,
  };
}
