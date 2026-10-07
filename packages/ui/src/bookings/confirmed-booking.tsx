import type { Booking } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { canComplain } from '../feedback/complain-cell';
import { Icon, type IconName } from '../icons';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { openExternal } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { DriverRow } from '../trip/driver-row';
import { TripCard } from '../trip/trip-card';
import { BookingBanner, endedBadly } from './booking-banner';
import { DoneTools } from './done-tools';
import { MeetingCard, meetingTime } from './meeting-card';
import { mapUrl } from './map-link';
import { useTripSteps } from './use-trip-steps';
import './confirmed-booking.css';

type Props = {
  readonly booking: Booking;
  readonly onBack: () => void;
  // The chat, the call (the chat that rings at once), the complaint or the review.
  readonly onOpen: (screen: 'chat' | 'call' | 'complaint' | 'review') => void;
  // Null when the seat is used or the trip went: nothing to cancel (docs/35).
  readonly onCancel: (() => void) | null;
  readonly onTold: (booking: Booking) => void;
  // «Yana Jasur bilan» after the trip (mockup g60/7); «Oʻxshash safarlar» after a bad end (docs/124 А).
  readonly onAgain: () => void;
  readonly onOthers: () => void;
  readonly children?: ReactNode;
};

// The page of a confirmed seat (owner decision 06.10.2026, docs/118 path 3, mockup g60/1): who,
// which car, where; three big buttons; one main button that follows the trip.
export function ConfirmedBooking(props: Props) {
  const { booking, onBack, onOpen, onCancel, onTold, onAgain, onOthers, children } = props;
  const moved = booking.trip.firstDepartAt !== booking.trip.departAt;
  useScreenView('bookings.passenger');
  useScreenBackground('tinted');
  const { t, formatNumber } = useI18n();
  const { driver } = booking.trip;
  const { colors } = useBrand().theme;
  const steps = useTripSteps(booking, onTold);
  const button = (icon: IconName, label: string, onClick: () => void) => (
    <button type="button" className="booking-button" onClick={onClick}>
      <Icon name={icon} size={24} />
      {label}
    </button>
  );
  return (
    <div className="booking-page" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <BookingBanner booking={booking} />
      {meetingTime(booking, Date.now()) ? <MeetingCard booking={booking} onTold={onTold} /> : null}
      <div className="booking-card">
        <DriverRow
          driver={driver}
          car={driver.car}
          note={
            driver.rating.average === null
              ? null
              : t('find.stars', { rating: formatNumber(driver.rating.average) })
          }
          plate={booking.plate}
        />
        <TripCard booking={booking} onPoint={(point) => openExternal(mapUrl(point))} />
      </div>
      {booking.status === 'completed' ? (
        <>
          <DoneTools booking={booking} onOpen={onOpen} />
          <MainButton text={t('bookings.done.again', { name: driver.firstName })} onClick={onAgain} />
        </>
      ) : (
        <>
          <p className="booking-hint">{t('find.payHint')}</p>
          {children}
          <ActionFailure error={steps.failure} />
          <div className="booking-buttons">
            {button('chat', t('chat.open'), () => onOpen('chat'))}
            {booking.status === 'confirmed' ? button('phone', t('calls.call'), () => onOpen('call')) : null}
            {booking.status === 'confirmed' ? button('share', t('bookings.toClose'), steps.share) : null}
          </div>
          {steps.note ? (
            <p className="booking-hint booking-note">
              {t(`share.${steps.note}`)}
              {steps.note === 'told' ? (
                <button type="button" className="booking-link" onClick={steps.stop}>
                  {t('share.stop')}
                </button>
              ) : null}
            </p>
          ) : null}
          <div className="booking-links">
            {canComplain(booking.status) ? (
              <button type="button" className="booking-link" onClick={() => onOpen('complaint')}>
                {t('complaints.title')}
              </button>
            ) : null}
            {onCancel ? (
              <button type="button" className="booking-link booking-link-danger" onClick={onCancel}>
                {t(moved ? 'bookings.disagree' : 'bookings.cancel')}
              </button>
            ) : null}
          </div>
          {steps.next ? <MainButton text={t(`share.${steps.next}`)} onClick={steps.step} /> : null}
          {endedBadly(booking.status) ? <MainButton text={t('bookings.others')} onClick={onOthers} /> : null}
        </>
      )}
    </div>
  );
}
