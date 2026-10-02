import type { RideRequest } from '@platform/contracts';
import { Button, Tappable, Text, Title } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { FactChips, statusIcon, type Fact } from './fact-chips';
import { RouteView } from './route-view';
import { noonOf } from './when';

const PHOTO_SIZE = 40;

type RequestCardProps = {
  readonly request: RideRequest;
  readonly showStatus?: boolean;
  // Drivers' offers waiting for the passenger's answer (docs/65 C).
  readonly offers?: number;
  readonly onOpen: () => void;
};

// One request in a list: the day and the price, A and B, who goes and how many people (docs/09).
export function RequestCard({ request, showStatus = false, offers = 0, onOpen }: RequestCardProps) {
  const { t, formatMoney, formatDate } = useI18n();
  const { passenger } = request;
  const facts: readonly Fact[] = [
    ['passengers', t('market.request.seats', { count: String(request.seats) })],
    ...(showStatus ? [[statusIcon(request.status), t(`market.status.${request.status}`)] as const] : []),
    ...(offers > 0 ? [['car', t('market.request.offers', { count: String(offers) })] as const] : []),
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
        <FactChips facts={facts} />
        <div className="trip-card-foot">
          <ProfilePhoto
            userId={passenger.id}
            name={passenger.firstName}
            hasAvatar={passenger.hasAvatar}
            size={PHOTO_SIZE}
          />
          <Text className="trip-card-driver">{passenger.firstName}</Text>
        </div>
      </Tappable>
    </Section>
  );
}

type RequestScreenProps = {
  readonly request: RideRequest;
  readonly onBack: () => void;
  readonly onCancel?: () => void;
  // A driver offers a time and a price (docs/35).
  readonly onOffer?: () => void;
  // Drivers' offers for the passenger's own request.
  readonly children?: ReactNode;
};

// One request. The passenger cancels an open one and answers offers; a driver sends an offer
// from the native main button (docs/86 V6).
export function RequestScreen({ request, onBack, onCancel, onOffer, children }: RequestScreenProps) {
  useScreenView('market.request');
  const { t, formatMoney, formatDate } = useI18n();
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <div className="market">
      <Screen onBack={onBack} />
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
        {children}
      </List>
      <div className="step-note">
        {onCancel && request.status === 'open' ? (
          <Button mode="bezeled" size="l" stretched onClick={onCancel}>
            {t('market.request.cancel')}
          </Button>
        ) : null}
      </div>
      {onOffer && request.status === 'open' ? (
        <MainButton text={t('market.request.offer')} onClick={onOffer} />
      ) : null}
    </div>
  );
}
