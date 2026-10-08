import type { RideRequest } from '@platform/contracts';
import { Caption, Tappable, Text } from '@telegram-apps/telegram-ui';
import { Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { FactChips, statusIcon, type Fact } from './fact-chips';
import { RouteView } from './route-view';
import { noonOf } from './when';

type RequestCardProps = {
  readonly request: RideRequest;
  // Drivers' offers waiting for the passenger's answer (docs/65 C).
  readonly offers: number;
  readonly onOpen: () => void;
};

// The passenger's own request in a list: the day and the price of one seat, A and B, how many
// people and the status; the own face and name do not show (G37, docs/101 R6). A driver sees the
// requests on «Yoʻlovchilar soʻrovlari» (G64).
export function RequestCard({ request, offers, onOpen }: RequestCardProps) {
  const { t, formatMoney, formatDate } = useI18n();
  const facts: readonly Fact[] = [
    ['passengers', t('market.request.seats', { count: String(request.seats) })],
    // The group takes the whole car (G61).
    ...(request.wholeCar ? [['car', t('market.request.wholeCar')] as const] : []),
    [statusIcon(request.status), t(`market.status.${request.status}`)],
    ...(offers > 0 ? [['car', t('market.request.offers', { count: String(offers) })] as const] : []),
  ];
  return (
    <Section>
      <Tappable Component="div" className="trip-card" interactiveAnimation="background" onClick={onOpen}>
        <div className="trip-card-head">
          <Text weight="2">{formatDate(noonOf(request.date))}</Text>
          <div className="trip-price-box">
            <Text weight="1" className="trip-price">
              {formatMoney(request.price)}
            </Text>
            <Caption className="trip-price-unit">{t('market.request.perSeat')}</Caption>
          </div>
        </div>
        <RouteView from={request.from} to={request.to} />
        <FactChips facts={facts} />
      </Tappable>
    </Section>
  );
}
