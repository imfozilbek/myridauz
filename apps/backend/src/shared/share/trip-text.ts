import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { endNames, PLAIN, type Places } from '../places/end-names';
import { tripTimeText } from '../telegram/trip-time';
import { passengerValue, withValue } from './value-lines';

const { t, formatDate, formatMoney } = createI18n(DEFAULT_LOCALE);

// The facts of a trip a driver sends to people.
export type SharedTrip = {
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // The end of a range (G90, docs/216); null: one time.
  readonly departUntil: number | null;
  readonly seatsLeft: number;
  readonly price: number;
};

// The driver's trip for people (G88, docs/193): the free seats in the driver's own voice, both ends
// (docs/121), the day and the price of a seat, then why the brand. Plain text: a card and the window
// t.me/share/url read it alike.
export function tripShareText(trip: SharedTrip, places: Places): string {
  const names = endNames(trip.from, trip.to, places, PLAIN);
  const text = t('share.trip.text', {
    seats: String(trip.seatsLeft),
    from: names.from,
    to: names.to,
    date: formatDate(new Date(trip.departAt)),
    time: tripTimeText(trip),
    price: formatMoney(trip.price),
  });
  return withValue(text, passengerValue());
}

// The title of the card in Telegram's window and its button.
export const tripShareWords = () => ({ title: t('share.trip.title'), button: t('market.trip.book') });
