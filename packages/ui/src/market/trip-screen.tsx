import type { Trip } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, type ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { Badge, Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { IconTile } from '../icon-tile';
import { Screen } from '../screen/screen';
import { otherPrice } from './other-price';
import { RouteView } from './route-view';
import { TripDriver } from './trip-driver';
import { useWayFacts } from './way-line';
import './market.css';

type TripScreenProps = {
  readonly trip: Trip;
  readonly onBack: () => void;
  // The bookings of the trip for the team (G08).
  readonly children?: ReactNode;
};

// Everything about one trip for the team, with its bookings: no booking, no cancel (owner decision
// 29.09.2026, docs/35). A passenger sees «Safar» (find/safar-screen.tsx, G59).
export function TripScreen({ trip, onBack, children }: TripScreenProps) {
  useScreenView('market.trip');
  const { track } = useAnalytics();
  const { t, formatMoney, formatDate, formatWeekday } = useI18n();
  const wayFacts = useWayFacts();
  const day = new Date(trip.departAt);
  useEffect(() => {
    track({ name: 'trip_open', screen: 'market.trip' });
  }, [track]);
  const line = (icon: IconName, label: string, value: string) => (
    <Cell before={<IconTile name={icon} />} after={<CellValue>{value}</CellValue>}>
      {label}
    </Cell>
  );
  const recommended = otherPrice(trip);
  // A fact of the way with its icon, like on the cards (docs/88 L15).
  const fact = (icon: IconName, text: string) => (
    <Cell
      key={text}
      before={
        <span className="fact-icon">
          <Icon name={icon} />
        </span>
      }
    >
      {text}
    </Cell>
  );
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('market.date.other', { date: formatDate(day), weekday: formatWeekday(day) })}
      </Title>
      <Text className="market-subtitle">{t('market.trip.km', { km: String(trip.km) })}</Text>
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          {line('seats', t('market.review.seats'), String(trip.seatsLeft))}
          {line('price', t('market.review.price'), formatMoney(trip.price))}
          {recommended === null
            ? null
            : line('statistics', t('market.trip.recommended'), formatMoney(recommended))}
          {trip.woman ? fact('profile', t('market.search.woman')) : null}
          {wayFacts(trip).map(([icon, text]) => fact(icon, text))}
          {trip.comment ? <Cell description={trip.comment}>{t('market.review.comment')}</Cell> : null}
          <Cell
            after={
              <Badge
                type="number"
                mode={trip.status === 'active' ? 'primary' : 'gray'}
                className="trip-status"
              >
                {t(`market.status.${trip.status}`)}
              </Badge>
            }
          >
            {t('market.review.status')}
          </Cell>
        </Section>
        <TripDriver trip={trip} />
        {children}
      </List>
    </div>
  );
}
