import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { useTopUp } from '../wallet/top-up-link';
import { RiderLine, useRiderStars } from './rider-line';
import './seat-request-card.css';

const FACE = 42;
const WALLET = 16;

type Props = {
  readonly booking: Booking;
  // What the wallet lacks for the commission: the way to top up, not a «Tasdiqlash» that fails (G27).
  readonly missing: number;
  readonly onAnswer: (action: 'confirm' | 'decline') => unknown;
  // The booking itself: its deadline, its points, a complaint.
  readonly onOpen: () => void;
};

// One request on «Mening safarim» (owner decision 06.10.2026, mockup g63/3): who, the rating, where,
// how many; the commission is in the card, the answer is one tap, no window in between (docs/122).
// Short of the commission, the card says how much and «Hisobni toʻldirish» opens the support chat
// at once (docs/170 В9, G78 sheet 3).
export function SeatRequestCard({ booking, missing, onAnswer, onOpen }: Props) {
  const { t, formatNumber } = useI18n();
  const stars = useRiderStars(booking);
  const topUp = useTopUp();
  const short = missing > 0;
  const confirm = useOneAtATime(() =>
    short ? topUp(booking.passenger.firstName, missing) : onAnswer('confirm'),
  );
  const decline = useOneAtATime(() => onAnswer('decline'));
  const busy = confirm.busy || decline.busy;
  const { passenger } = booking;
  return (
    <div className={short ? 'seat-card seat-card-short' : 'seat-card'}>
      <button type="button" className="seat-card-head" onClick={onOpen}>
        <PersonBadge
          id={passenger.id}
          name={passenger.firstName}
          hasAvatar={false}
          size={FACE}
          role="passenger"
        />
        <span className="seat-card-who">
          <span className="seat-card-name">
            <b>{passenger.firstName}</b>
            {stars ? <span className="seat-card-stars">{stars}</span> : null}
          </span>
          <RiderLine booking={booking} withCommission className="seat-card-line" />
        </span>
        <b className="seat-card-count">{t('market.request.seats', { count: String(booking.seats) })}</b>
      </button>
      {short ? (
        <p className="seat-card-missing">
          <Icon name="wallet" size={WALLET} />
          {t('driverTrip.short', { amount: formatNumber(missing) })}
        </p>
      ) : null}
      <div className="seat-card-buttons">
        <button type="button" className="seat-card-decline" disabled={busy} onClick={decline.run}>
          {t('bookings.decline')}
        </button>
        <button type="button" className="seat-card-confirm" disabled={busy} onClick={confirm.run}>
          {t(short ? 'wallet.topUp' : 'bookings.confirm')}
        </button>
      </div>
    </div>
  );
}
