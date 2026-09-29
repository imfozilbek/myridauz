import type { Trip } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { usePlaceName } from './places-gate';
import { useWhenLabel } from './when';
import './market.css';

type TripScreenProps = {
  readonly trip: Trip;
  readonly onBack: () => void;
  // The driver's own trip: it can be cancelled while it is active (docs/35).
  readonly onCancel?: () => void;
};

const PHOTO_SIZE = 56;

// Everything about one trip. Booking a seat comes in G08; until then the button says so.
export function TripScreen({ trip, onBack, onCancel }: TripScreenProps) {
  useScreenView('market.trip');
  const { track } = useAnalytics();
  const { t, formatMoney } = useI18n();
  const place = usePlaceName();
  const when = useWhenLabel();
  const [asked, setAsked] = useState(false);
  useEffect(() => track({ name: 'trip_open', screen: 'market.trip' }), [track]);
  const { driver } = trip;
  const live = trip.status === 'active' || trip.status === 'full';
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">{`${place(trip.from)} → ${place(trip.to)}`}</Title>
      <Text className="market-subtitle">{t('market.trip.km', { km: String(trip.km) })}</Text>
      <List>
        <Section>
          {line(t('market.review.when'), when(trip.departAt))}
          {line(t('market.review.seats'), String(trip.seats))}
          {line(t('market.review.price'), formatMoney(trip.price))}
          {trip.woman ? <Cell>{t('market.search.woman')}</Cell> : null}
          {trip.hasMeetingPoint ? <Cell>{t('market.trip.meeting')}</Cell> : null}
          {trip.comment ? (
            <Cell multiline description={trip.comment}>
              {t('market.review.comment')}
            </Cell>
          ) : null}
          {onCancel ? line(t('market.review.status'), t(`market.status.${trip.status}`)) : null}
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
          >
            {driver.firstName}
          </Cell>
        </Section>
      </List>
      <div className="step-note">
        {onCancel && live ? (
          <Button mode="bezeled" size="l" stretched onClick={onCancel}>
            {t('market.trip.cancel')}
          </Button>
        ) : null}
        {onCancel ? null : (
          <Button size="l" stretched onClick={() => setAsked(true)}>
            {t('market.trip.book')}
          </Button>
        )}
        {asked ? <Text className="step-hint">{t('market.trip.bookSoon')}</Text> : null}
      </div>
    </div>
  );
}
