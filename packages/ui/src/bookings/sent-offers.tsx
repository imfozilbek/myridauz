import type { Offer } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { RouteView } from '../market/route-view';

// The driver's offers on passengers' requests (docs/35): the route, the time, the answer.
export function SentOffers({ offers }: { readonly offers: readonly Offer[] }) {
  const { t, formatMoney, formatDate } = useI18n();
  if (offers.length === 0) return null;
  return (
    <Section header={t('bookings.offer.mine')}>
      {offers.map((offer) => (
        <Cell
          key={offer.id}
          multiline
          description={<RouteView from={offer.from} to={offer.to} departAt={offer.departAt} km={offer.km} />}
          after={<CellValue>{formatMoney(offer.price)}</CellValue>}
        >
          {`${formatDate(new Date(offer.departAt))}, ${t(`bookings.offer.status.${offer.status}`)}`}
        </Cell>
      ))}
    </Section>
  );
}
