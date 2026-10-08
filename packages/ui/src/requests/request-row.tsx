import type { RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { useRiderStars } from '../own-trip/rider-line';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { RequestMarks } from './request-marks';
import './request-row.css';

// The values of the mockups g64/1 and g64/2 at 360 px: the face 62 px of the mockup at 1.5.
const FACE = 41.33;
const LETTER = 16;
const TOOL_ICON = 17;

// «Safarimga taklif qilish» on the driver's trip, «Safar ochib taklif qilish» for a whole car,
// «Taklif yuborish» with a time and a price (docs/118 path 7).
export type RowAction = 'onTrip' | 'salon' | 'offer';
export const ACTIONS: Record<RowAction, TranslationKey> = {
  onTrip: 'requests.action.onTrip',
  salon: 'requests.action.salon',
  offer: 'bookings.offer.send',
};

type Props = {
  readonly request: RideRequest;
  // «Chilonzor → Samarqand», the names of the card (docs/121).
  readonly route: string;
  // The way the driver's trip adds for this passenger, under «Safaringizga mos».
  readonly extraKm?: number;
  // The day of the trip a whole car opens, when it is not today (mockup g64/3 phone 1).
  readonly day?: string | undefined;
  readonly action: RowAction;
  // A live offer of the driver waits for the answer: one offer at a time (docs/35).
  readonly offered: boolean;
  readonly onAction: () => unknown;
  readonly onChat: () => void;
  readonly onCall: () => void;
};

// One request on «Yoʻlovchilar soʻrovlari» (G64, mockups g64/2 and g64/3): who and the rating, the
// route, the price of a seat and how many, the marks; a chat and a call before a booking, numbers
// hidden (docs/07), and the one action.
export function RequestRow({
  request,
  route,
  extraKm,
  day,
  action,
  offered,
  onAction,
  onChat,
  onCall,
}: Props) {
  const { t, formatNumber } = useI18n();
  const act = useOneAtATime(onAction);
  const { passenger } = request;
  const stars = useRiderStars(request);
  const extra = extraKm === undefined ? null : t('way.driver.extra', { km: String(extraKm) });
  return (
    <div className="request-row">
      <div className="request-row-head">
        <PersonBadge
          id={passenger.id}
          name={passenger.firstName}
          hasAvatar={passenger.hasAvatar}
          size={FACE}
          letter={LETTER}
          plain
        />
        <span className="request-row-who">
          <span className="request-row-name">
            <b>{passenger.firstName}</b>
            {stars ? <span className="request-row-stars">{stars}</span> : null}
          </span>
          {/* One line of words: it wraps where the words of the mockup wrap (g64/2 phone 1). */}
          <span className="request-row-line">{[route, extra, day].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="request-row-price">
          <b>{formatNumber(request.price)}</b>
          <span>{t('market.request.seats', { count: String(request.seats) })}</span>
        </span>
      </div>
      <RequestMarks request={request} />
      <div className="request-row-actions">
        <button type="button" className="request-tool" aria-label={t('chat.open')} onClick={onChat}>
          <Icon name="chat" size={TOOL_ICON} />
        </button>
        <button type="button" className="request-tool" aria-label={t('calls.call')} onClick={onCall}>
          <Icon name="phone" size={TOOL_ICON} />
        </button>
        <button type="button" className="request-act" disabled={offered || act.busy} onClick={act.run}>
          {t(offered ? 'bookings.offer.sent.title' : ACTIONS[action])}
        </button>
      </div>
    </div>
  );
}
