import type { RideRequest } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { usePlaceName } from './places-gate';
import { noonOf } from './when';

const PHOTO_SIZE = 44;

// One request in a list: who, where, which day, how many people, the price (docs/09).
export function RequestCard({
  request,
  showStatus = false,
  onOpen,
}: {
  readonly request: RideRequest;
  readonly showStatus?: boolean;
  readonly onOpen: () => void;
}) {
  const { t, formatMoney, formatDate } = useI18n();
  const place = usePlaceName();
  const { passenger } = request;
  const details = [passenger.firstName, ...(showStatus ? [t(`market.status.${request.status}`)] : [])];
  return (
    <Cell
      multiline
      before={
        <ProfilePhoto
          userId={passenger.id}
          name={passenger.firstName}
          hasAvatar={passenger.hasAvatar}
          size={PHOTO_SIZE}
        />
      }
      subtitle={`${formatDate(noonOf(request.date))} · ${t('market.request.seats', { count: String(request.seats) })}`}
      description={details.join(' · ')}
      after={<CellValue>{formatMoney(request.price)}</CellValue>}
      onClick={onOpen}
    >
      {`${place(request.from, false)} → ${place(request.to, false)}`}
    </Cell>
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
  const place = usePlaceName();
  const [asked, setAsked] = useState(false);
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">{`${place(request.from)} → ${place(request.to)}`}</Title>
      <Text className="market-subtitle">{t('market.trip.km', { km: String(request.km) })}</Text>
      <List>
        <Section>
          {line(t('market.review.when'), formatDate(noonOf(request.date)))}
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
