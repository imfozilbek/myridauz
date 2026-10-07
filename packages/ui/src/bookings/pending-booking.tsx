import type { Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { BookingPoints } from './booking-points';
import './pending-booking.css';
import { UzPlate } from '../plate/uz-plate';

type Props = {
  readonly booking: Booking;
  readonly onBack: () => void;
  readonly onCancel: () => void;
  readonly onHome: () => void;
  readonly children?: ReactNode;
};

// The page of a sent request (owner decision 06.10.2026, docs/118 path 2, C): no screen «Soʻrov
// yuborildi», the booking at once with «Javob kutilmoqda» and until when the driver answers.
export function PendingBooking({ booking, onBack, onCancel, onHome, children }: Props) {
  useScreenView('bookings.pending');
  useScreenBackground();
  const { t, formatDate, formatTime, formatNumber, formatMoney, formatRating } = useI18n();
  const { colors } = useBrand().theme;
  const { trip } = booking;
  const { driver } = trip;
  const until = new Date(booking.expiresAt);
  const details = [
    `${driver.car.make} ${driver.car.model}`,
    ...(driver.rating.average === null
      ? []
      : [t('find.stars', { rating: formatRating(driver.rating.average) })]),
  ];
  return (
    <div className="find pending" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <div className="pending-banner">
        <span className="pending-tile">
          <Icon name="waiting" size={22} />
        </span>
        <span className="pending-banner-text">
          <b>{t('bookings.status.requested')}</b>
          <span>
            {t('bookings.pending.until', {
              name: driver.firstName,
              date: formatDate(until),
              time: formatTime(until),
            })}
          </span>
        </span>
      </div>
      <div className="pending-card">
        <div className="pending-driver">
          <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={42} />
          <span className="pending-driver-text">
            <b>{driver.firstName}</b>
            <span className="plate-line">
              {details.join(' · ')}
              <UzPlate plate={driver.car.plate} size="s" />
            </span>
          </span>
        </div>
        <BookingPoints booking={booking} />
        <div className="pending-sum">
          <span>
            {t('bookings.points.line', { seats: String(booking.seats), price: formatNumber(booking.price) })}
          </span>
          <b>{formatMoney(booking.price * booking.seats)}</b>
        </div>
      </div>
      {children}
      <button type="button" className="pending-cancel" onClick={onCancel}>
        {t('market.request.cancel')}
      </button>
      <MainButton text={t('bookings.pending.home')} onClick={onHome} />
    </div>
  );
}
