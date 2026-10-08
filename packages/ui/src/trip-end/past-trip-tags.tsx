import { afterTrip, type Booking, type Trip } from '@platform/contracts';
import { daysLeft } from '../bookings/done-tools';
import { useI18n } from '../context/i18n-context';
import { refundWaits } from '../meeting/no-show-text';
import { ridersOf } from './trip-sums';
import './past-trip-tags.css';

type Tone = 'due' | 'plain' | 'done';
type Props = { readonly trip: Trip; readonly bookings: readonly Booking[]; readonly now: number };

// What is left of a past trip on its card in «Oʻtgan» (docs/129, mockup g63/5 phone 4): the stars
// to give with the days left, all given, the refund of a no-show waiting or back.
export function PastTripTags({ trip, bookings, now }: Props) {
  const { t } = useI18n();
  if (trip.status !== 'completed') return null;
  const riders = ridersOf(bookings);
  const { rateUntil } = afterTrip(trip.departAt, trip.km);
  const tags: (readonly [Tone, string])[] = [];
  if (riders.length > 0 && riders.every((booking) => booking.rated === true))
    tags.push(['done', t('driverAfter.tag.rated')]);
  else if (riders.length > 0 && now < rateUntil)
    tags.push(['due', t('bookings.past.rate', { days: daysLeft(rateUntil, now) })]);
  if (bookings.some(refundWaits)) tags.push(['plain', t('driverAfter.tag.refund')]);
  else if (bookings.some((booking) => booking.refund?.state === 'confirmed'))
    tags.push(['done', t('wallet.kind.refund')]);
  if (tags.length === 0) return null;
  return (
    <span className="past-tags">
      {tags.map(([tone, text]) => (
        <span key={text} className={`past-tag past-tag-${tone}`}>
          {text}
        </span>
      ))}
    </span>
  );
}
