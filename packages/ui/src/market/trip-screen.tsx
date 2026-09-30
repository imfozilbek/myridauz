import type { Trip } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, type ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { FavoriteCell } from '../comfort/favorite-cell';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { PersonReviews } from '../feedback/driver-reviews';
import { RatingBadge } from '../feedback/rating-badge';
import { BackButton } from '../telegram/back-button';
import { RouteView } from './route-view';
import './market.css';

type TripScreenProps = {
  readonly trip: Trip;
  readonly onBack: () => void;
  // The driver's own trip: it can be cancelled while it is active (docs/35).
  readonly onCancel?: () => void;
  // A passenger books seats on it (G08).
  readonly onBook?: () => void;
  // The team looks at a trip: no booking, no cancel (owner decision 29.09.2026).
  readonly readOnly?: boolean;
  // The bookings of the trip for its driver or the team (G08).
  readonly children?: ReactNode;
};

const PHOTO_SIZE = 56;

// Everything about one trip; a passenger books from here, its driver sees the bookings (docs/35).
export function TripScreen({ trip, onBack, onCancel, onBook, readOnly = false, children }: TripScreenProps) {
  useScreenView('market.trip');
  const { track } = useAnalytics();
  const { t, formatMoney, formatDate, formatWeekday } = useI18n();
  const day = new Date(trip.departAt);
  useEffect(() => track({ name: 'trip_open', screen: 'market.trip' }), [track]);
  const { driver } = trip;
  const live = trip.status === 'active' || trip.status === 'full';
  // A trip on the road takes nobody: an old link or "Sevimli" shows why (docs/65 B8).
  const departed = trip.departAt <= Date.now();
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('market.date.other', { date: formatDate(day), weekday: formatWeekday(day) })}
      </Title>
      <Text className="market-subtitle">{t('market.trip.km', { km: String(trip.km) })}</Text>
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          {line(t('market.review.seats'), String(trip.seatsLeft))}
          {line(t('market.review.price'), formatMoney(trip.price))}
          {trip.recommendedPrice === null
            ? null
            : line(t('market.trip.recommended'), formatMoney(trip.recommendedPrice))}
          {trip.woman ? <Cell>{t('market.search.woman')}</Cell> : null}
          {trip.hasMeetingPoint ? <Cell>{t('market.trip.meeting')}</Cell> : null}
          {trip.comment ? (
            <Cell multiline description={trip.comment}>
              {t('market.review.comment')}
            </Cell>
          ) : null}
          {onCancel || readOnly ? line(t('market.review.status'), t(`market.status.${trip.status}`)) : null}
        </Section>
        <Section header={t('market.trip.driver')}>
          <Cell
            before={
              <ProfilePhoto
                userId={driver.id}
                name={driver.firstName}
                hasAvatar={driver.hasAvatar}
                size={PHOTO_SIZE}
              />
            }
            subtitle={`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
            after={<RatingBadge rating={driver.rating} />}
          >
            {driver.firstName}
          </Cell>
        </Section>
        {onBook && !readOnly ? <FavoriteCell driverId={driver.id} screen="market.trip" /> : null}
        <PersonReviews userId={driver.id} />
        {children}
      </List>
      <div className="step-note">
        {onCancel && live ? (
          <Button mode="bezeled" size="l" stretched onClick={onCancel}>
            {t('market.trip.cancel')}
          </Button>
        ) : null}
        {onBook && !readOnly && trip.status === 'active' && !departed ? (
          <Button size="l" stretched onClick={onBook}>
            {t('market.trip.book')}
          </Button>
        ) : null}
        {onBook && !readOnly && departed ? <Text>{t('market.trip.departed')}</Text> : null}
      </div>
    </div>
  );
}
