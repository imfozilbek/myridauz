import type { RideRequest } from '@platform/contracts';
import { Button, Caption, Tappable, Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { RouteView } from './route-view';
import { noonOf } from './when';

const PHOTO_SIZE = 40;

type RequestCardProps = {
  readonly request: RideRequest;
  readonly showStatus?: boolean;
  readonly onOpen: () => void;
};

// One request in a list: the day and the price, A and B, who goes and how many people (docs/09).
export function RequestCard({ request, showStatus = false, onOpen }: RequestCardProps) {
  const { t, formatMoney, formatDate } = useI18n();
  const { passenger } = request;
  const facts = [
    t('market.request.seats', { count: String(request.seats) }),
    ...(showStatus ? [t(`market.status.${request.status}`)] : []),
  ];
  return (
    <Section>
      <Tappable Component="div" className="trip-card" interactiveAnimation="background" onClick={onOpen}>
        <div className="trip-card-head">
          <Text weight="2">{formatDate(noonOf(request.date))}</Text>
          <Text weight="1" className="trip-price">
            {formatMoney(request.price)}
          </Text>
        </div>
        <RouteView from={request.from} to={request.to} />
        <div className="trip-card-foot">
          <ProfilePhoto
            userId={passenger.id}
            name={passenger.firstName}
            hasAvatar={passenger.hasAvatar}
            size={PHOTO_SIZE}
          />
          <Text className="trip-card-driver">{passenger.firstName}</Text>
          <Caption className="trip-card-hint trip-card-facts">{facts.join(' · ')}</Caption>
        </div>
      </Tappable>
    </Section>
  );
}

type RequestScreenProps = {
  readonly request: RideRequest;
  readonly onBack: () => void;
  readonly onCancel?: () => void;
};

// One request. The passenger cancels an open one; a driver sends an offer in G08.
export function RequestScreen({ request, onBack, onCancel }: RequestScreenProps) {
  useScreenView('market.request');
  const { t, formatMoney, formatDate } = useI18n();
  const [asked, setAsked] = useState(false);
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {formatDate(noonOf(request.date))}
      </Title>
      <Text className="market-subtitle">{t('market.trip.km', { km: String(request.km) })}</Text>
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={request.from} to={request.to} />
          </div>
          {line(t('market.requestSeats.title'), String(request.seats))}
          {line(t('market.review.price'), formatMoney(request.price))}
          {line(t('market.review.status'), t(`market.status.${request.status}`))}
        </Section>
      </List>
      <div className="step-note">
        {onCancel && request.status === 'open' ? (
          <Button mode="bezeled" size="l" stretched onClick={onCancel}>
            {t('market.request.cancel')}
          </Button>
        ) : null}
        {onCancel ? null : (
          <Button size="l" stretched onClick={() => setAsked(true)}>
            {t('market.request.offer')}
          </Button>
        )}
        {asked ? <Text className="step-hint">{t('market.request.offerSoon')}</Text> : null}
      </div>
    </div>
  );
}
