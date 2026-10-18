import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { endNames, PLAIN, type Places } from '../places/end-names';
import { passengerValue, withValue } from './value-lines';

const { t, formatDate, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

// The facts of a trip a driver sends to people.
export type SharedTrip = {
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly seatsLeft: number;
  readonly price: number;
};

// The driver's trip for people (G88, docs/193): the free seats in the driver's own voice, both ends
// (docs/121), the day and the price of a seat, then why the brand. Plain text: a card and the window
// t.me/share/url read it alike.
export function tripShareText(trip: SharedTrip, places: Places): string {
  const names = endNames(trip.from, trip.to, places, PLAIN);
  const day = new Date(trip.departAt);
  const text = t('share.trip.text', {
    seats: String(trip.seatsLeft),
    from: names.from,
    to: names.to,
    date: formatDate(day),
    time: formatTime(day),
    price: formatMoney(trip.price),
  });
  return withValue(text, passengerValue());
}

// The title of the card in Telegram's window and its button.
export const tripShareWords = () => ({ title: t('share.trip.title'), button: t('market.trip.book') });
