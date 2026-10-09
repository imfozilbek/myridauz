import type { BrandConfig } from '@platform/brands';
import { REQUEST_LINK, SHEET_LINK, tashkentDayStart, type Offer } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import { endNames, type Places } from '../../../shared/places/end-names';
import { bold, escapeHtml, italic, quote } from '../../../shared/telegram/html';
import { passengerRequestCard } from '../../../shared/telegram/card-keys';
import { appButton } from '../../../shared/telegram/open-button';
import type { RequestFacts } from '../application/request-facts';
import { dayOf } from './card-when';

const { t, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

// The live card of a request in the passenger bot (G68, docs/122): drivers see it, «N ta taklif»,
// the offer taken, burned or cancelled. It stays on top of the chat while the request is open.
function statusLine(request: RequestFacts, offers: number): string {
  if (request.status === 'open')
    return offers > 0 ? t('bot.request.offers', { count: String(offers) }) : t('bot.request.open');
  if (request.status === 'matched') return t('bot.request.matched');
  return request.status === 'expired' ? t('bot.request.expired') : t('bot.card.cancelled');
}

type Facts = {
  readonly brand: BrandConfig;
  readonly request: RequestFacts;
  // The offers waiting for the passenger's answer.
  readonly offers: number;
  readonly places: Places;
  readonly now: number;
};

export function requestCard({ brand, request, offers, places, now }: Facts): Card {
  const names = endNames(request.from, request.to, places);
  const price = bold(formatMoney(request.price * request.seats));
  const text = [
    bold(statusLine(request, offers)),
    bold(dayOf(tashkentDayStart(request.date), now)),
    quote([`🟢 ${names.from}`]),
    quote([`🔴 ${names.to}`]),
    t('bot.card.seats', { seats: String(request.seats), price }),
    ...(request.wholeCar ? [t('bot.request.wholeCar')] : []),
  ].join('\n');
  const open = request.status === 'open';
  const label = t(offers > 0 ? 'bot.request.offersButton' : 'bot.open');
  const button = appButton(brand, 'passenger', label, { name: REQUEST_LINK, id: request.id });
  return {
    bot: 'passenger',
    chatId: request.passengerId,
    key: passengerRequestCard(request.id),
    text,
    footer: italic(t('bot.card.updated', { time: formatTime(new Date(now)) })),
    markup: { inline_keyboard: open ? [[button]] : [] },
    pin: open,
  };
}

// The first offer on a request rings under its card with a button to it (docs/122); the next ones
// only count on the card.
export const firstOfferRing = (
  brand: BrandConfig,
  request: RequestFacts,
  offer: Offer,
  quiet: boolean,
): Ring => ({
  bot: 'passenger',
  chatId: request.passengerId,
  text: t('bot.ring.offer', {
    name: escapeHtml(offer.driver.firstName),
    time: formatTime(new Date(offer.departAt)),
    price: formatMoney(offer.price),
  }),
  markup: {
    // The main screen with the sheet of the offer: «Qabul qilish» in one tap (G68, docs/122).
    inline_keyboard: [[appButton(brand, 'passenger', t('bot.open'), { name: SHEET_LINK, id: offer.id })]],
  },
  card: passengerRequestCard(request.id),
  quiet,
});
