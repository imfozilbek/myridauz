import { tripMarks, type Trip } from '@platform/contracts';
import { Caption, Tappable, Text } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { tripPast } from '../own-trip/trip-stage';
import { CarSwatch } from '../driver/car-swatch';
import { RatingBadge } from '../feedback/rating-badge';
import { FactChips, statusIcon, type Fact } from './fact-chips';
import { otherPrice } from './other-price';
import { RouteView } from './route-view';
import { useWayFacts } from './way-line';

const PHOTO_SIZE = 40;

type TripCardProps = {
  readonly trip: Trip;
  readonly showStatus?: boolean;
  // The own trips of a driver: with the status; the driver and the car are the same on every card (U6).
  readonly own?: boolean;
  // New requests waiting for the driver: seen on the card, not only inside the trip (G41).
  readonly requests?: number;
  readonly onOpen: () => void;
  // What is left of a past own trip (G63, docs/129): the tags under the marks.
  readonly children?: ReactNode;
};

// One trip in a list, everything a person decides by: the day, the distance and the price,
// A and B with the times, the driver's comment, the driver and the car, the seats and the marks.
export function TripCard(props: TripCardProps) {
  const { trip, showStatus = false, own = false, requests = 0, onOpen, children } = props;
  const { t, formatMoney, formatDate } = useI18n();
  const { driver } = trip;
  const wayFacts = useWayFacts();
  // A trip the driver arrived on is over before the server closes it (lead decision 08.10.2026).
  const status = tripPast(trip) ? 'completed' : trip.status;
  // «Tez orada joʻnaydi» and «Narxi tushdi» lead the marks of the search (G39, docs/104, 10).
  const marks: readonly Fact[] = own
    ? []
    : tripMarks(trip, Date.now()).map((mark) => [
        mark === 'soon' ? 'waiting' : 'cheaper',
        t(`market.mark.${mark}`),
      ]);
  const facts: readonly Fact[] = [
    ...(requests > 0 ? [['request', t('home.requests', { count: String(requests) })] as const] : []),
    ['passengers', t('market.trip.seats', { count: String(trip.seatsLeft) })],
    ...(trip.woman ? [['profile', t('market.search.woman')] as const] : []),
    ...wayFacts(trip),
    ...(showStatus || own ? [[statusIcon(status), t(`market.status.${status}`)] as const] : []),
  ];
  const recommended = otherPrice(trip);
  return (
    <Section>
      <Tappable Component="div" className="trip-card" interactiveAnimation="background" onClick={onOpen}>
        <div className="trip-card-head">
          {/* The distance is on the way below, not twice (G40, docs/106 C7). */}
          <Text weight="2">{formatDate(new Date(trip.departAt))}</Text>
          <span className="trip-card-prices">
            <Text weight="1" className="trip-price">
              {formatMoney(trip.price)}
            </Text>
            {recommended === null ? null : (
              <Caption className="trip-card-hint">
                {t('market.trip.recommendedShort', { price: formatMoney(recommended) })}
              </Caption>
            )}
          </span>
        </div>
        <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
        {trip.comment ? <Caption className="trip-card-comment">{trip.comment}</Caption> : null}
        <FactChips facts={facts} marks={marks} />
        {children}
        {own ? null : (
          <div className="trip-card-foot">
            <ProfilePhoto
              userId={driver.id}
              name={driver.firstName}
              hasAvatar={driver.hasAvatar}
              size={PHOTO_SIZE}
            />
            <span className="trip-card-driver">
              <span className="trip-card-name">
                <Text>{driver.firstName}</Text>
                <RatingBadge rating={driver.rating} />
              </span>
              <Caption className="trip-card-hint trip-card-car">
                <CarSwatch color={driver.car.color} />
                {`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
              </Caption>
            </span>
          </div>
        )}
      </Tappable>
    </Section>
  );
}
