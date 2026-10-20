import { afterTrip, DAY_MS, isGone, type Booking } from '@platform/contracts';
import { useOpenSupport } from '../telegram/support-link';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { useUntilText } from '../trip/until-text';
import { useCallsOn } from '../call/calls-on';

type Props = {
  readonly booking: Booking;
  readonly onOpen: (screen: 'chat' | 'call' | 'complaint' | 'review') => void;
  // The driver marked «Kelmadi»: the ride was not hers, no stars (G91 PAS-1).
  readonly missed?: boolean;
};

// Whole days left, at least one while the deadline has not come (docs/129).
export const daysLeft = (until: number, now: number) => Math.max(1, Math.floor((until - now) / DAY_MS));

// After the trip (owner decision 06.10.2026, docs/129, mockups g60/6 and g60/7): what Rida still
// gives, and each thing with its deadline. The chat stays to read; the complaint goes to support.
export function DoneTools({ booking, onOpen, missed = false }: Props) {
  const { t } = useI18n();
  const callsOn = useCallsOn();
  const brand = useBrand();
  const { name } = brand;
  const support = useOpenSupport();
  const now = Date.now();
  const { talkUntil, rateUntil, complainUntil, pointsUntil } = afterTrip(
    brand,
    booking.trip.departAt,
    booking.trip.km,
    booking.trip.arrivedAt,
  );
  const untilText = useUntilText();
  const until = (ms: number) => untilText(ms, now);
  // A deleted driver has nobody to write or call (G89 M9).
  const gone = isGone(booking.trip.driver);
  const talk = now < talkUntil && !gone;
  const rate = now < rateUntil;
  const tile = (icon: IconName, label: string, sub: string, onClick: () => void) => (
    <button type="button" className="booking-button" onClick={onClick}>
      <Icon name={icon} size={22} />
      {label}
      <span className="booking-button-sub">{sub}</span>
    </button>
  );
  return (
    <>
      <p className="booking-hint">
        {now < pointsUntil ? t('bookings.done.why', { brand: name }) : t('bookings.done.pointsGone')}
      </p>
      <div className="booking-buttons">
        {talk ? tile('chat', t('chat.open'), until(talkUntil), () => onOpen('chat')) : null}
        {talk || gone
          ? null
          : tile('chat', t('bookings.done.messages'), t('bookings.done.readOnly'), () => onOpen('chat'))}
        {talk && callsOn ? tile('phone', t('calls.call'), until(talkUntil), () => onOpen('call')) : null}
        {missed
          ? null
          : tile(
              'star',
              t(rate ? 'bookings.done.rate' : 'bookings.done.rating'),
              rate
                ? t('bookings.done.daysLeft', { days: daysLeft(rateUntil, now) })
                : t('bookings.done.over'),
              () => onOpen('review'),
            )}
      </div>
      <div className="booking-links">
        {now < complainUntil ? (
          <button type="button" className="booking-link" onClick={() => onOpen('complaint')}>
            {t('bookings.done.complain', { days: daysLeft(complainUntil, now) })}
          </button>
        ) : (
          <button type="button" className="booking-link" onClick={() => support()}>
            {t('bookings.done.complainSupport')}
          </button>
        )}
      </div>
    </>
  );
}
