import type { Offer } from '@platform/contracts';
import type { ReactNode } from 'react';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { RatingBadge } from '../feedback/rating-badge';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import '../market/market.css';
import { useOneAtATime } from '../telegram/one-at-a-time';

const BIG_PHOTO_SIZE = 56;

type ScreenProps = {
  readonly offer: Offer;
  readonly onBack: () => void;
  // Each answer runs once: a second tap while it runs does nothing (docs/65 A4).
  readonly onAccept: () => unknown;
  readonly onDecline: () => unknown;
  readonly onChat: () => void;
  // A reason why the last answer did not work (docs/65 B3).
  readonly children?: ReactNode;
};

// One offer: the passenger accepts it (a trip and a confirmed booking appear) or declines it.
export function OfferScreen({ offer, onBack, onAccept, onDecline, onChat, children }: ScreenProps) {
  useScreenView('bookings.offer');
  const { t, formatMoney } = useI18n();
  const { driver } = offer;
  const accept = useOneAtATime(onAccept);
  const decline = useOneAtATime(onDecline);
  const busy = accept.busy || decline.busy;
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {driver.firstName}
      </Title>
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={offer.from} to={offer.to} departAt={offer.departAt} km={offer.km} />
          </div>
          {line(t('bookings.review.seats'), String(offer.seats))}
          {line(t('market.review.price'), formatMoney(offer.price))}
          {line(t('bookings.review.total'), formatMoney(offer.price * offer.seats))}
        </Section>
        <Section header={t('market.trip.driver')}>
          <Cell
            before={
              <ProfilePhoto
                userId={driver.id}
                name={driver.firstName}
                hasAvatar={driver.hasAvatar}
                size={BIG_PHOTO_SIZE}
              />
            }
            subtitle={`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
            after={<RatingBadge rating={driver.rating} />}
          >
            {driver.firstName}
          </Cell>
          <Cell before={<IconTile name="chat" />} onClick={onChat}>
            {t('chat.open')}
          </Cell>
        </Section>
        {children}
      </List>
      <div className="step-note">
        <Button size="l" stretched loading={accept.busy} disabled={busy} onClick={accept.run}>
          {t('bookings.offer.accept')}
        </Button>
        <Button
          mode="bezeled"
          size="l"
          stretched
          loading={decline.busy}
          disabled={busy}
          onClick={decline.run}
        >
          {t('bookings.offer.decline')}
        </Button>
      </div>
    </div>
  );
}

// The passenger took an offer: the seat is confirmed, the trip is in "Mening safarlarim".
export function OfferAccepted({ onDone }: { readonly onDone: () => void }) {
  const { t } = useI18n();
  return (
    <StepLayout
      icon="selected"
      title={t('bookings.offer.accepted.title')}
      hint={t('bookings.offer.accepted.hint')}
    >
      <MainButton text={t('market.done')} onClick={onDone} />
    </StepLayout>
  );
}
