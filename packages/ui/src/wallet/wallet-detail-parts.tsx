import { arrivalAt, tashkentDate, type Booking, type WalletDetail } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { useShortDay } from '../market/when';
import { useBookingEnds } from '../trip/booking-ends';
import { TripPoint } from '../trip/trip-point';
import '../trip/trip-card.css';

const FACE = 32;
const LETTER = 15;
const CHEVRON = 10;

type TripProps = {
  readonly booking: Booking;
  readonly onRider?: (() => void) | undefined;
};

// «Safar» of the details (mockup g65/2): the two points of the booking with the day and the times,
// then the passenger and the seats.
export function DetailTrip({ booking, onRider }: TripProps) {
  const { t, formatTime } = useI18n();
  const shortDay = useShortDay();
  const { start, end } = useBookingEnds(booking);
  const { trip, passenger } = booking;
  const when = t('driverTrip.when', {
    day: shortDay(tashkentDate(trip.departAt), Date.now()),
    time: formatTime(new Date(trip.departAt)),
  });
  const arrives = t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))) });
  const rider = (
    <>
      <PersonBadge
        id={passenger.id}
        name={passenger.firstName}
        hasAvatar={false}
        size={FACE}
        letter={LETTER}
        plain
      />
      <span className="wallet-rider-name">
        {t('wallet.detail.rider', { name: passenger.firstName, seats: String(booking.seats) })}
      </span>
    </>
  );
  return (
    <div className="wallet-box">
      <div className="trip-card-way wallet-way">
        <TripPoint kind="from" name={start} note={when} />
        <TripPoint kind="to" name={end} note={arrives} />
      </div>
      {onRider ? (
        <button type="button" className="wallet-rider" onClick={onRider}>
          {rider}
          <Icon name="next" size={CHEVRON} />
        </button>
      ) : (
        <div className="wallet-rider">{rider}</div>
      )}
    </div>
  );
}

// «Hisob» (mockup g65/2): the seat price, the seats, what the passenger pays the driver, the
// commission of the brand and the balance it came from or went back to.
export function DetailCount({ detail }: { readonly detail: WalletDetail }) {
  const { t, formatNumber } = useI18n();
  const { commission } = useBrand();
  const { booking } = detail;
  const name = (balance: 'bonus' | 'main') => t(balance === 'bonus' ? 'wallet.bonus' : 'wallet.card.main');
  const rows = [
    [t('wallet.detail.price'), formatNumber(booking.price)],
    [t('wallet.detail.seats'), String(booking.seats)],
    [t('wallet.detail.pays'), formatNumber(booking.price * booking.seats)],
    [t('wallet.detail.fee', { percent: String(commission.percent) }), formatNumber(Math.abs(detail.amount))],
    [
      t(detail.kind === 'refund' ? 'wallet.detail.to' : 'wallet.detail.from'),
      detail.balances.map(name).join(', '),
    ],
  ] as const;
  return (
    <div className="wallet-box wallet-count">
      {rows.map(([label, value], index) => (
        <span key={label} className="wallet-count-row">
          <span>{label}</span>
          {index === rows.length - 2 ? <b>{value}</b> : <span>{value}</span>}
        </span>
      ))}
    </div>
  );
}
