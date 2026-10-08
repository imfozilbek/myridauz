import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { useRiderLine, useRiderStars } from './rider-line';

const FACE = 42;
const LETTER = 16;

type Props = {
  readonly booking: Booking;
  // The wallet holds less than the commission: the way to top up, not a «Tasdiqlash» that fails (G27).
  readonly short: boolean;
  readonly onAnswer: (action: 'confirm' | 'decline') => unknown;
  readonly onTopUp: () => void;
  // The booking itself: its deadline, its points, a complaint.
  readonly onOpen: () => void;
};

// One request on «Mening safarim» (owner decision 06.10.2026, mockup g63/3): who, the rating, where,
// how many; the commission is in the card, the answer is one tap, no window in between (docs/122).
export function SeatRequestCard({ booking, short, onAnswer, onTopUp, onOpen }: Props) {
  const { t } = useI18n();
  const line = useRiderLine(booking, true);
  const stars = useRiderStars(booking);
  const confirm = useOneAtATime(() => (short ? onTopUp() : onAnswer('confirm')));
  const decline = useOneAtATime(() => onAnswer('decline'));
  const busy = confirm.busy || decline.busy;
  const { passenger } = booking;
  return (
    <div className="seat-card">
      <button type="button" className="seat-card-head" onClick={onOpen}>
        <PersonBadge
          id={passenger.id}
          name={passenger.firstName}
          hasAvatar={false}
          size={FACE}
          letter={LETTER}
          plain
        />
        <span className="seat-card-who">
          <span className="seat-card-name">
            <b>{passenger.firstName}</b>
            {stars ? <span className="seat-card-stars">{stars}</span> : null}
          </span>
          <span className="seat-card-line">{line}</span>
        </span>
        <b className="seat-card-count">{t('market.request.seats', { count: String(booking.seats) })}</b>
      </button>
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
