import type { Booking, Point } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { PlateView } from '../driver/plate-view';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { openExternal } from '../telegram/feedback';
import { mapUrl } from './map-link';
import '../market/market.css';

const PHOTO_SIZE = 56;
export type BookingAction = { readonly label: string; readonly onClick: () => void; readonly main?: boolean };
type Props = {
  readonly booking: Booking;
  readonly side: 'passenger' | 'driver';
  readonly onBack: () => void;
  readonly actions: readonly BookingAction[];
  // The chat and, for the passenger, sharing the trip (G09).
  readonly children?: ReactNode;
};

// One booking (docs/35). The plate and the places open only after the confirmation (docs/07, docs/14).
export function BookingScreen({ booking, side, onBack, actions, children }: Props) {
  useScreenView(`bookings.${side}`);
  const { t, formatMoney, formatDate, formatWeekday } = useI18n();
  const { trip } = booking;
  const day = new Date(trip.departAt);
  const open = booking.status === 'confirmed' || booking.status === 'completed';
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  const place = (label: string, point: Point | null) =>
    point ? (
      <Cell onClick={() => openExternal(mapUrl(point))} subtitle={t('bookings.openMap')}>
        {label}
      </Cell>
    ) : (
      line(label, t('bookings.noPoint'))
    );
  const person =
    side === 'passenger'
      ? {
          id: trip.driver.id,
          name: trip.driver.firstName,
          avatar: trip.driver.hasAvatar,
          car: trip.driver.car,
        }
      : {
          id: booking.passenger.id,
          name: booking.passenger.firstName,
          avatar: booking.passenger.hasAvatar,
          car: null,
        };
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('market.date.other', { date: formatDate(day), weekday: formatWeekday(day) })}
      </Title>
      <Text className="market-subtitle">{t(`bookings.status.${booking.status}`)}</Text>
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          {line(t('bookings.review.seats'), String(booking.seats))}
          {line(t('bookings.review.total'), formatMoney(booking.price * booking.seats))}
          {side === 'driver' ? line(t('bookings.offer.commission'), formatMoney(booking.commission)) : null}
        </Section>
        {open ? (
          <Section footer={side === 'passenger' && !booking.pickup ? t('bookings.pickupHint') : undefined}>
            {booking.plate ? (
              <Cell multiline description={<PlateView plate={booking.plate} small />}>
                {t('bookings.plate')}
              </Cell>
            ) : null}
            {side === 'passenger' ? place(t('bookings.meeting'), booking.meetingPoint) : null}
            {place(t(side === 'passenger' ? 'bookings.pickup.mine' : 'bookings.pickup'), booking.pickup)}
          </Section>
        ) : null}
        <Section header={t(side === 'passenger' ? 'market.trip.driver' : 'bookings.passengers')}>
          <Cell
            before={
              <ProfilePhoto
                userId={person.id}
                name={person.name}
                hasAvatar={person.avatar}
                size={PHOTO_SIZE}
              />
            }
            subtitle={
              person.car
                ? `${person.car.make} ${person.car.model}, ${t(`drivers.color.${person.car.color}`)}`
                : undefined
            }
          >
            {person.name}
          </Cell>
        </Section>
        {children}
      </List>
      <div className="step-note">
        {actions.map((action) => (
          <Button
            key={action.label}
            mode={action.main ? 'filled' : 'bezeled'}
            size="l"
            stretched
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
