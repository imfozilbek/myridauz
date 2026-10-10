import { tashkentDate, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { useCardDay } from '../market/when';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import { useBookingEnds } from '../trip/booking-ends';
import { TripPoint } from '../trip/trip-point';
import { useRiderStars } from './rider-line';
import './request-sheet.css';

const FACE = 52;
const LETTER = 18;

type Props = {
  readonly booking: Booking | null;
  // The wallet holds less than the commission: the top up instead of «Tasdiqlash» (G27, G75).
  readonly short: boolean;
  readonly onAnswer: (booking: Booking, action: 'confirm' | 'decline') => unknown;
  readonly onTopUp: (booking: Booking) => void;
  readonly onClose: () => void;
};

// «Yangi soʻrov» over «Mening safarim» (G75, mockup g75/4 B phone 1): the deadline, who and when,
// the two points, the commission; «Rad etish» and «Tasdiqlash», the trip stays seen under it.
export function RequestSheet({ booking, short, onAnswer, onTopUp, onClose }: Props) {
  const { t, formatTime } = useI18n();
  const day = useCardDay();
  const when = (at: number) => `${day(tashkentDate(at), Date.now())} ${formatTime(new Date(at))}`;
  return (
    <FormSheet
      open={booking !== null}
      title={t('sheet.request.kicker')}
      {...(booking ? { hint: t('driverTrip.request.until', { when: when(booking.expiresAt) }) } : {})}
      onClose={onClose}
    >
      {booking ? (
        <>
          <RequestCard booking={booking} />
          <button
            type="button"
            className="form-sheet-link request-decline"
            onClick={() => onAnswer(booking, 'decline')}
          >
            {t('bookings.decline')}
          </button>
          <MainButton
            text={short ? t('wallet.topUp') : t('bookings.confirm')}
            onClick={() => (short ? onTopUp(booking) : onAnswer(booking, 'confirm'))}
          />
        </>
      ) : null}
    </FormSheet>
  );
}

function RequestCard({ booking }: { readonly booking: Booking }) {
  const { t, formatTime, formatMoney } = useI18n();
  const day = useCardDay();
  const stars = useRiderStars(booking);
  const ends = useBookingEnds(booking);
  const { passenger, trip } = booking;
  const time = formatTime(new Date(trip.departAt));
  return (
    <div className="request-card">
      <div className="request-card-head">
        <PersonBadge
          id={passenger.id}
          name={passenger.firstName}
          hasAvatar={false}
          size={FACE}
          letter={LETTER}
          plain
        />
        <span className="request-card-who">
          <b>{passenger.firstName}</b>
          {stars ? <span className="request-card-stars">{stars}</span> : null}
          <span className="request-card-when">
            {t('driverTrip.request.when', {
              seats: String(booking.seats),
              day: day(tashkentDate(trip.departAt), Date.now()),
              time,
            })}
          </span>
        </span>
      </div>
      <div className="request-card-points">
        <TripPoint kind="from" name={ends.start} note={t('driverTrip.request.pickup', { time })} />
        <TripPoint kind="to" name={ends.end} note={t('driverTrip.request.dropoff')} />
      </div>
      <p className="request-card-row">
        <span>{t('bookings.offer.commission')}</span>
        <b>{formatMoney(booking.commission)}</b>
      </p>
    </div>
  );
}
