import type { Offer } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { RowCard } from '../mine/row-card';
import { useWay } from '../mine/use-way';

// The driver's offers on passengers' requests (docs/35): the way, the day, the price, the answer; a
// card of its own each (G75, mockup g75/2 A). A tap opens the chat with the passenger (docs/07).
type Props = { readonly offers: readonly Offer[]; readonly onOpen: (offer: Offer) => void };

export function SentOffers({ offers, onOpen }: Props) {
  const { t, formatMoney, formatDate } = useI18n();
  const way = useWay();
  if (offers.length === 0) return null;
  return (
    <>
      <Caption className="market-group">{t('bookings.offer.mine')}</Caption>
      {offers.map((offer) => (
        <RowCard
          key={offer.id}
          icon="send"
          title={way(offer.from, offer.to)}
          hint={`${formatDate(new Date(offer.departAt))} · ${formatMoney(offer.price)} · ${t(`bookings.offer.status.${offer.status}`)}`}
          onOpen={() => onOpen(offer)}
        />
      ))}
    </>
  );
}
