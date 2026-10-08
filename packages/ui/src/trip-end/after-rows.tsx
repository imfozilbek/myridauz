import { afterTrip, type Booking, type Trip } from '@platform/contracts';
import { daysLeft } from '../bookings/done-tools';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useUntilText } from '../trip/until-text';
import { tripSums } from './trip-sums';
import './after-rows.css';

export type AfterRow = 'rate' | 'talk' | 'complain' | 'commission';

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly now: number;
  readonly onRow: (row: AfterRow) => void;
};

// «Safardan keyin» of the driver (docs/129, mockup g63/5 phone 5): what may still be done after the
// trip, each with its deadline from afterTrip, and what became of the commission.
export function AfterRows({ trip, bookings, now, onRow }: Props) {
  const { t, formatNumber } = useI18n();
  const untilText = useUntilText();
  const { rateUntil, talkUntil, complainUntil } = afterTrip(trip.departAt, trip.km);
  const sums = tripSums(bookings);
  const left = (until: number) =>
    now < until ? t('bookings.done.daysLeft', { days: daysLeft(until, now) }) : t('bookings.done.over');
  const charged = formatNumber(sums.charged);
  const commission =
    sums.waits > 0
      ? t('driverAfter.past.refundable', { charged, refund: formatNumber(sums.waits) })
      : sums.refunded > 0
        ? t('driverAfter.past.refunded', { charged, refund: formatNumber(sums.refunded) })
        : t('driverAfter.past.charged', { charged });
  const rows: readonly (readonly [AfterRow, string, string])[] = [
    ['rate', t('driverAfter.past.rate'), left(rateUntil)],
    [
      'talk',
      t('driverAfter.past.talk'),
      now < talkUntil
        ? t('driverAfter.past.talkUntil', { until: untilText(talkUntil, now) })
        : t('bookings.done.over'),
    ],
    ['complain', t('complaints.title'), left(complainUntil)],
    ['commission', t('wallet.kind.commission'), commission],
  ];
  return (
    <div className="past-after">
      {rows.map(([row, title, sub]) => (
        <button key={row} type="button" className="past-after-row" onClick={() => onRow(row)}>
          <span className="past-after-text">
            {title}
            <span>{sub}</span>
          </span>
          <Icon name="next" size={12} />
        </button>
      ))}
    </div>
  );
}
