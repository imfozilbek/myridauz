import { afterTrip, DAY_MS, tashkentDate, type Booking } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useBookingEnds } from '../trip/booking-ends';
import { daysLeft } from './done-tools';
import { today, tomorrow } from '../market/when';
import './past-booking-row.css';

type Props = { readonly booking: Booking; readonly onOpen: () => void };
type Chip = readonly [tone: 'due' | 'done' | 'plain' | 'gone', text: string];

// One past trip in «Oʻtgan» (owner decision 06.10.2026, docs/129, mockup g60/6): when, where, who,
// and what may still be done, each with its deadline.
export function PastBookingRow({ booking, onOpen }: Props) {
  const { t, formatShortDate, formatTime, formatRating, formatNumber } = useI18n();
  const { regionName } = useBookingEnds(booking);
  const chips = useChips(booking);
  const { trip } = booking;
  const day = tashkentDate(trip.departAt);
  const now = Date.now();
  const dayText =
    day === today(now)
      ? t('market.day.today')
      : day === tashkentDate(now - DAY_MS)
        ? t('bookings.past.yesterday')
        : formatShortDate(new Date(trip.departAt));
  const { average } = trip.driver.rating;
  return (
    <Tappable Component="div" className="past-row" interactiveAnimation="background" onClick={onOpen}>
      <span className="past-row-text">
        <b>{t('bookings.confirmed.when', { day: dayText, time: formatTime(new Date(trip.departAt)) })}</b>
        <span>{t('bookings.past.route', { from: regionName(trip.from), to: regionName(trip.to) })}</span>
        <span className="past-row-who">
          {[
            average === null
              ? trip.driver.firstName
              : `${trip.driver.firstName} ${t('find.stars', { rating: formatRating(average) })}`,
            t('bookings.card.seats', { seats: booking.seats }),
            // The sum without «soʻm» on a short row (mockup g60/6).
            formatNumber(booking.price * booking.seats),
          ].join(' · ')}
        </span>
        {chips.length > 0 ? (
          <span className="past-row-chips">
            {chips.map(([tone, text]) => (
              <span key={text} className={`past-chip past-chip-${tone}`}>
                {text}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <Icon name="next" size={12} />
    </Tappable>
  );
}

// What is left after the trip (docs/129): the rating, the chat, else the points that went.
function useChips(booking: Booking): readonly Chip[] {
  const { t } = useI18n();
  if (booking.status !== 'completed') return [['plain', t(`bookings.status.${booking.status}`)]];
  const now = Date.now();
  const { talkUntil, rateUntil, pointsUntil } = afterTrip(booking.trip.departAt, booking.trip.km);
  // A month later only the end of the exact points is left to say (mockup g60/6).
  if (now >= pointsUntil) return [['gone', t('bookings.past.erased')]];
  const chips: Chip[] = [];
  if (booking.rated) chips.push(['done', t('bookings.past.rated')]);
  else if (now < rateUntil) chips.push(['due', t('bookings.past.rate', { days: daysLeft(rateUntil, now) })]);
  if (now < talkUntil)
    chips.push([
      'plain',
      t(tashkentDate(talkUntil) === tomorrow(now) ? 'bookings.past.talkTomorrow' : 'bookings.past.talkToday'),
    ]);
  return chips;
}
