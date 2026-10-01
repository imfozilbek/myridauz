import type { Offer } from '@platform/contracts';
import { Caption, Section as TguiSection } from '@telegram-apps/telegram-ui';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { useChevron } from '../chevron';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { RatingBadge } from '../feedback/rating-badge';
import '../market/market.css';

const PHOTO_SIZE = 40;

type ListProps = { readonly offers: readonly Offer[]; readonly onOpen: (offer: Offer) => void };

// Drivers' offers on the passenger's request (docs/35): who, what time, what price. A hint above
// the list and the opening rows say an offer is opened and accepted there (docs/86 V5).
export function OffersSection({ offers, onOpen }: ListProps) {
  const { t, formatMoney, formatTime } = useI18n();
  const chevron = useChevron();
  if (offers.length === 0) return null;
  const header = (
    <>
      <TguiSection.Header>{t('bookings.offer.list')}</TguiSection.Header>
      <Caption className="section-hint">{t('bookings.offer.listHint')}</Caption>
    </>
  );
  return (
    <Section header={header}>
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
          after={chevron(<CellValue>{formatMoney(offer.price)}</CellValue>)}
          description={<RatingBadge rating={offer.driver.rating} />}
        >
          {offer.driver.firstName}
        </Cell>
      ))}
    </Section>
  );
}
