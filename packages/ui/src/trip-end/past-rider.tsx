import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { useNoShowText } from '../meeting/no-show-text';
import { useBookingEnds } from '../trip/booking-ends';

const FACE = 35;
const LETTER = 14;
const TOOL_ICON = 16;

type Props = {
  readonly booking: Booking;
  // The stars the driver gave, when known.
  readonly stars: number | undefined;
  // The call only while the chat is open after the trip; the chat stays to read (docs/129).
  readonly talk: boolean;
  readonly onChat: () => void;
  readonly onCall: () => void;
};

// A passenger of the past trip (mockup g63/5 phone 5): the stars given, or what became of the
// commission of a passenger who did not come; the chat stays, the call while the chat is open (docs/129).
export function PastRider({ booking, stars, talk, onChat, onCall }: Props) {
  const { t } = useI18n();
  const noShow = useNoShowText()(booking);
  const { start } = useBookingEnds(booking);
  const { passenger } = booking;
  const given =
    stars === undefined ? null : t('driverAfter.past.rated', { stars: t('find.star').repeat(stars) });
  return (
    <div className="past-rider">
      <PersonBadge
        id={passenger.id}
        name={passenger.firstName}
        hasAvatar={false}
        size={FACE}
        letter={LETTER}
        plain
      />
      <span className="past-rider-who">
        <span className="past-rider-name">
          <b>{passenger.firstName}</b>
          {` · ${t('market.request.seats', { count: String(booking.seats) })}`}
        </span>
        <span className={noShow ? 'past-rider-line no-show-line' : 'past-rider-line'}>
          {noShow ?? given ?? start}
        </span>
      </span>
      <button type="button" className="past-rider-tool" aria-label={t('chat.open')} onClick={onChat}>
        <Icon name="chat" size={TOOL_ICON} />
      </button>
      {talk ? (
        <button type="button" className="past-rider-tool" aria-label={t('calls.call')} onClick={onCall}>
          <Icon name="phone" size={TOOL_ICON} />
        </button>
      ) : null}
    </div>
  );
}
