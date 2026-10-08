import { afterTrip, type Booking, type Trip } from '@platform/contracts';
import { daysLeft } from '../bookings/done-tools';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useUntilText } from '../trip/until-text';
import { ridersOf, tripSums } from './trip-sums';
import './after-rows.css';

// The chevron of a row that opens something (mockup g63/5 phone 5).
const CHEVRON = 9.6;

export type AfterRow = 'rate' | 'talk' | 'complain' | 'support' | 'commission';

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly now: number;
  readonly onRow: (row: AfterRow) => void;
};

// One row: what it is, its deadline; null when there is nothing to open any more.
type Row = readonly [AfterRow | null, string, string];

// «Safardan keyin» of the driver (docs/129, mockup g63/5 phone 5): what may still be done after the
// trip, each with its deadline from afterTrip, as for the passenger (DoneTools): the chat stays to
// read, a late complaint goes to support, no stars after their days.
export function AfterRows({ trip, bookings, now, onRow }: Props) {
  const { t, formatNumber } = useI18n();
  const untilText = useUntilText();
  const { rateUntil, talkUntil, complainUntil } = afterTrip(trip.departAt, trip.km);
  const sums = tripSums(bookings);
  const left = (until: number) => t('bookings.done.daysLeft', { days: daysLeft(until, now) });
  const over = t('bookings.done.over');
  const charged = formatNumber(sums.charged);
  const commission =
    sums.waits > 0
      ? t('driverAfter.past.refundable', { charged, refund: formatNumber(sums.waits) })
      : sums.refunded > 0
        ? t('driverAfter.past.refunded', { charged, refund: formatNumber(sums.refunded) })
        : t('driverAfter.past.charged', { charged });
  const toRate = ridersOf(bookings).some((booking) => booking.rated !== true);
  const rows: readonly Row[] = [
    now >= rateUntil
      ? [null, t('driverAfter.past.rate'), over]
      : toRate
        ? ['rate', t('driverAfter.past.rate'), left(rateUntil)]
        : [null, t('driverAfter.past.rate'), t('driverAfter.tag.rated')],
    now < talkUntil
      ? [
          'talk',
          t('driverAfter.past.talk'),
          t('driverAfter.past.talkUntil', { until: untilText(talkUntil, now) }),
        ]
      : ['talk', t('bookings.done.messages'), t('bookings.done.readOnly')],
    now < complainUntil
      ? ['complain', t('complaints.title'), left(complainUntil)]
      : ['support', t('bookings.done.complainSupport'), over],
    ['commission', t('wallet.kind.commission'), commission],
  ];
  return (
    <div className="past-after">
      {rows.map(([row, title, sub]) => {
        const text = (
          <span className="past-after-text">
            {title}
            <span>{sub}</span>
          </span>
        );
        return row ? (
          <button key={title} type="button" className="past-after-row" onClick={() => onRow(row)}>
            {text}
            <Icon name="next" size={CHEVRON} />
          </button>
        ) : (
          <div key={title} className="past-after-row">
            {text}
          </div>
        );
      })}
    </div>
  );
}
