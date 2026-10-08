import type { Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { RiderLine } from './rider-line';

const FACE = 36;
const LETTER = 14;
const TOOL_ICON = 16;
// The bubble of the chat is drawn smaller than the phone beside it (mockups g63/3, g63/5).
const CHAT_ICON = 14.4;

type Props = {
  readonly booking: Booking;
  // The chat and the call of the chat header (G60): the call rings as soon as the chat allows it.
  // No call once the chat after the trip is only to read (docs/129).
  readonly onChat: () => void;
  readonly onCall?: (() => void) | undefined;
  // The booking itself: cancel the seat, complain. A past trip has none to open.
  readonly onOpen?: () => void;
  // The line under the name instead of the usual one, where the person is taken: «Kelmadi» of the
  // meeting, the stars given after the trip (G63, docs/129). It may hold a button of its own.
  readonly line?: (usual: ReactNode) => ReactNode;
};

// A confirmed passenger on «Mening safarim» (mockup g63/3) and on the past trip (mockup g63/5): the
// name and the seats, where to take them, then the chat and the call; numbers are never shown
// (docs/07). The button of the name covers the whole row (own-trip-people.css), so the line beside
// it may be a button too, never a button inside a button.
export function RiderRow({ booking, onChat, onCall, onOpen, line }: Props) {
  const { t } = useI18n();
  const { passenger } = booking;
  const usual = <RiderLine booking={booking} withCommission={false} className="rider-line" />;
  const name = (
    <span className="rider-name">
      <b>{passenger.firstName}</b>
      {` · ${t('market.request.seats', { count: String(booking.seats) })}`}
    </span>
  );
  return (
    <div className="rider-row">
      <div className="rider-main">
        <PersonBadge
          id={passenger.id}
          name={passenger.firstName}
          hasAvatar={false}
          size={FACE}
          letter={LETTER}
          plain
        />
        <span className="rider-who">
          {onOpen ? (
            <button type="button" className="rider-open" onClick={onOpen}>
              {name}
            </button>
          ) : (
            name
          )}
          {line ? line(usual) : usual}
        </span>
      </div>
      <button type="button" className="rider-tool" aria-label={t('chat.open')} onClick={onChat}>
        <Icon name="chat" size={CHAT_ICON} />
      </button>
      {onCall ? (
        <button type="button" className="rider-tool" aria-label={t('calls.call')} onClick={onCall}>
          <Icon name="phone" size={TOOL_ICON} />
        </button>
      ) : null}
    </div>
  );
}
