import { afterTrip, DAY_MS, tashkentDate, type Booking } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { today, tomorrow } from '../market/when';
import { openInTelegram } from '../telegram/feedback';

type Props = {
  readonly booking: Booking;
  readonly onOpen: (screen: 'chat' | 'call' | 'complaint' | 'review') => void;
};

// Whole days left, at least one while the deadline has not come (docs/129).
export const daysLeft = (until: number, now: number) => Math.max(1, Math.floor((until - now) / DAY_MS));

// After the trip (owner decision 06.10.2026, docs/129, mockups g60/6 and g60/7): what Rida still
// gives, and each thing with its deadline. The chat stays to read; the complaint goes to support.
export function DoneTools({ booking, onOpen }: Props) {
  const { t, formatDate, formatTime } = useI18n();
  const { bots } = useBrand();
  const now = Date.now();
  const { talkUntil, rateUntil, complainUntil } = afterTrip(booking.trip.departAt, booking.trip.km);
  const until = (ms: number) => {
    const time = formatTime(new Date(ms));
    const day = tashkentDate(ms);
    if (day === today(now)) return t('bookings.done.untilToday', { time });
    if (day === tomorrow(now)) return t('bookings.done.untilTomorrow', { time });
    return t('bookings.done.until', { date: formatDate(new Date(ms)), time });
  };
  const talk = now < talkUntil;
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
      <p className="booking-hint">{t('bookings.done.why')}</p>
      <div className="booking-buttons">
        {talk
          ? tile('chat', t('chat.open'), until(talkUntil), () => onOpen('chat'))
          : tile('chat', t('bookings.done.messages'), t('bookings.done.readOnly'), () => onOpen('chat'))}
        {talk ? tile('phone', t('calls.call'), until(talkUntil), () => onOpen('call')) : null}
        {tile(
          'star',
          t(rate ? 'bookings.done.rate' : 'bookings.done.rating'),
          rate ? t('bookings.done.daysLeft', { days: daysLeft(rateUntil, now) }) : t('bookings.done.over'),
          () => onOpen('review'),
        )}
      </div>
      <div className="booking-links">
        {now < complainUntil ? (
          <button type="button" className="booking-link" onClick={() => onOpen('complaint')}>
            {t('bookings.done.complain', { days: daysLeft(complainUntil, now) })}
          </button>
        ) : (
          <button
            type="button"
            className="booking-link"
            onClick={() => openInTelegram(`https://t.me/${bots.support}`)}
          >
            {t('bookings.done.complainSupport')}
          </button>
        )}
      </div>
    </>
  );
}
