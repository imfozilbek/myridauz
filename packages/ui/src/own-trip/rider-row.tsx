import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { RiderLine } from './rider-line';

const FACE = 36;
const LETTER = 14;
const TOOL_ICON = 16;

type Props = {
  readonly booking: Booking;
  // The chat and the call of the chat header (G60): the call rings as soon as the chat allows it.
  readonly onChat: () => void;
  readonly onCall: () => void;
  // The booking itself: cancel the seat, complain.
  readonly onOpen: () => void;
};

// A confirmed passenger on «Mening safarim» (mockup g63/3): the name and the seats, where to take
// them, then the chat and the call; numbers are never shown (docs/07).
export function RiderRow({ booking, onChat, onCall, onOpen }: Props) {
  const { t } = useI18n();
  const { passenger } = booking;
  return (
    <div className="rider-row">
      <button type="button" className="rider-open" onClick={onOpen}>
        <PersonBadge
          id={passenger.id}
          name={passenger.firstName}
          hasAvatar={false}
          size={FACE}
          letter={LETTER}
          plain
        />
        <span className="rider-who">
          <span className="rider-name">
            <b>{passenger.firstName}</b>
            {` · ${t('market.request.seats', { count: String(booking.seats) })}`}
          </span>
          <RiderLine booking={booking} withCommission={false} className="rider-line" />
        </span>
      </button>
      <button type="button" className="rider-tool" aria-label={t('chat.open')} onClick={onChat}>
        <Icon name="chat" size={TOOL_ICON} />
      </button>
      <button type="button" className="rider-tool" aria-label={t('calls.call')} onClick={onCall}>
        <Icon name="phone" size={TOOL_ICON} />
      </button>
    </div>
  );
}
