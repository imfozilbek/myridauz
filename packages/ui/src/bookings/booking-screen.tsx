import type { Booking } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { UzPlate } from '../plate/uz-plate';
import { RouteView } from '../market/route-view';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { BookingPlaces } from './booking-places';
import '../market/market.css';
import { BookingTimeline, hasTimeline } from './booking-timeline';

const PHOTO_SIZE = 56;
export type BookingAction = { readonly label: string; readonly onClick: () => void; readonly main?: boolean };
type Props = {
  readonly booking: Booking;
  readonly onBack: () => void;
  readonly actions: readonly BookingAction[];
  // The chat with the passenger (G09).
  readonly children?: ReactNode;
};

// One booking for the driver (docs/35): the passenger sees «Joyim» (G60). The plate and the places open
// only after the confirmation (docs/07, docs/14).
export function BookingScreen({ booking, onBack, actions, children }: Props) {
  useScreenView('bookings.driver');
  const { t, formatMoney, formatDate, formatWeekday } = useI18n();
  const { trip } = booking;
  const day = new Date(trip.departAt);
  const open = booking.status === 'confirmed' || booking.status === 'completed';
  const main = actions.find((action) => action.main);
  const others = actions.filter((action) => !action.main);
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  const { passenger } = booking;
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('market.date.other', { date: formatDate(day), weekday: formatWeekday(day) })}
      </Title>
      {hasTimeline(booking) ? null : (
        <Text className="market-subtitle">{t(`bookings.status.${booking.status}`)}</Text>
      )}
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          {line(t('bookings.review.seats'), String(booking.seats))}
          {line(t('bookings.review.total'), formatMoney(booking.price * booking.seats))}
          {line(t('bookings.offer.commission'), formatMoney(booking.commission))}
        </Section>
        {/* The chat right under the route: the first thing a person needs here (G40, docs/106 C4). */}
        {children}
        <BookingTimeline booking={booking} />
        {/* «The places do not change» is said once, before the booking (G40, docs/106 C9). */}
        <BookingPlaces booking={booking} />
        {open && booking.plate ? (
          <Section>
            <Cell description={<UzPlate plate={booking.plate} size="s" />}>{t('bookings.plate')}</Cell>
          </Section>
        ) : null}
        <Section header={t('bookings.passengers')}>
          <Cell
            before={
              <ProfilePhoto
                userId={passenger.id}
                name={passenger.firstName}
                hasAvatar={passenger.hasAvatar}
                size={PHOTO_SIZE}
              />
            }
          >
            {passenger.firstName}
          </Cell>
        </Section>
      </List>
      {/* The main action is the button of Telegram: always in sight, not under the page (docs/106 C5). */}
      {main ? <MainButton text={main.label} onClick={main.onClick} /> : null}
      <div className="step-note">
        {others.map((action) => (
          <Button key={action.label} mode="bezeled" size="l" stretched onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
