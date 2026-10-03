import type { Trip } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, type ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { Badge, Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { IconTile } from '../icon-tile';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { ClosedTrip } from './closed-trip';
import { otherPrice } from './other-price';
import { RouteView } from './route-view';
import { TripDriver } from './trip-driver';
import { useWayFacts } from './way-line';
import './market.css';

type TripScreenProps = {
  readonly trip: Trip;
  readonly onBack: () => void;
  // The driver's own trip: it can be cancelled while it is active (docs/35).
  readonly onCancel?: () => void;
  // A passenger books seats on it (G08); a closed one leads to the other trips of its day (docs/89 P8).
  readonly onBook?: () => void;
  readonly onOthers?: () => void;
  // The team looks at a trip: no booking, no cancel (owner decision 29.09.2026).
  readonly readOnly?: boolean;
  // The driver looks at the own trip: not at himself, his passengers come first (docs/86 V11).
  readonly own?: boolean;
  // The bookings of the trip for its driver or the team (G08).
  readonly children?: ReactNode;
};

// Everything about one trip; a passenger books from here, its driver sees the bookings (docs/35).
export function TripScreen(props: TripScreenProps) {
  const { trip, onBack, onCancel, onBook, onOthers, readOnly = false, own = false, children } = props;
  useScreenView('market.trip');
  const { track } = useAnalytics();
  const { t, formatMoney, formatDate, formatWeekday } = useI18n();
  const wayFacts = useWayFacts();
  const day = new Date(trip.departAt);
  useEffect(() => track({ name: 'trip_open', screen: 'market.trip' }), [track]);
  const live = trip.status === 'active' || trip.status === 'full';
  // A trip on the road takes nobody: an old link or "Sevimli" shows why (docs/65 B8).
  const departed = trip.departAt <= Date.now();
  // A trip from a channel or a link that takes nobody says why (docs/65 C).
  const closed =
    trip.status !== 'active'
      ? t(`market.trip.closed.${trip.status}`)
      : departed
        ? t('market.trip.departed')
        : null;
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
          {onCancel || readOnly ? (
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
          ) : null}
        </Section>
        {own ? null : <TripDriver trip={trip} favorite={Boolean(onBook) && !readOnly} />}
        {children}
      </List>
      <div className="step-note">
        {onCancel && live && !departed ? (
          <Button mode="bezeled" size="l" stretched onClick={onCancel}>
            {t('market.trip.cancel')}
          </Button>
        ) : null}
        {/* «Joy band qilish» is the main button of Telegram, as everywhere (G35, docs/97 PS9). */}
        {onBook && !readOnly && !closed ? <MainButton text={t('market.trip.book')} onClick={onBook} /> : null}
        {onBook && !readOnly && closed ? (
          <ClosedTrip trip={trip} reason={closed} onOthers={onOthers} />
        ) : null}
      </div>
    </div>
  );
}
