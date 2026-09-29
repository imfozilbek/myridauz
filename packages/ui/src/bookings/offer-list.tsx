import type { Offer } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import '../market/market.css';

const PHOTO_SIZE = 40;
const BIG_PHOTO_SIZE = 56;

type ListProps = { readonly offers: readonly Offer[]; readonly onOpen: (offer: Offer) => void };

// Drivers' offers on the passenger's request (docs/35): who, what time, what price.
export function OffersSection({ offers, onOpen }: ListProps) {
  const { t, formatMoney, formatTime } = useI18n();
  if (offers.length === 0) return null;
  return (
    <Section header={t('bookings.offer.list')}>
      {offers.map((offer) => (
        <Cell
          key={offer.id}
          onClick={() => onOpen(offer)}
          before={
            <ProfilePhoto
              userId={offer.driver.id}
              name={offer.driver.firstName}
              hasAvatar={offer.driver.hasAvatar}
              size={PHOTO_SIZE}
            />
          }
          subtitle={`${formatTime(new Date(offer.departAt))}, ${offer.driver.car.make} ${offer.driver.car.model}`}
          after={<CellValue>{formatMoney(offer.price)}</CellValue>}
        >
          {offer.driver.firstName}
        </Cell>
      ))}
    </Section>
  );
}

type ScreenProps = {
  readonly offer: Offer;
  readonly onBack: () => void;
  readonly onAccept: () => void;
  readonly onDecline: () => void;
  readonly onChat: () => void;
};

// One offer: the passenger accepts it (a trip and a confirmed booking appear) or declines it.
export function OfferScreen({ offer, onBack, onAccept, onDecline, onChat }: ScreenProps) {
  useScreenView('bookings.offer');
  const { t, formatMoney } = useI18n();
  const { driver } = offer;
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
          >
            {driver.firstName}
          </Cell>
          <Cell before={<IconTile name="chat" />} onClick={onChat}>
            {t('chat.open')}
          </Cell>
        </Section>
      </List>
      <div className="step-note">
        <Button size="l" stretched onClick={onAccept}>
          {t('bookings.offer.accept')}
        </Button>
        <Button mode="bezeled" size="l" stretched onClick={onDecline}>
          {t('bookings.offer.decline')}
        </Button>
      </div>
    </div>
  );
}
