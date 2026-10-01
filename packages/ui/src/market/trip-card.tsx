import type { Trip } from '@platform/contracts';
import { Caption, Tappable, Text } from '@telegram-apps/telegram-ui';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { CarSwatch } from '../driver/car-swatch';
import { RatingBadge } from '../feedback/rating-badge';
import { FactChips, statusIcon, type Fact } from './fact-chips';
import { RouteView } from './route-view';
import { useWayFacts } from './way-line';

const PHOTO_SIZE = 40;

type TripCardProps = {
  readonly trip: Trip;
  readonly showStatus?: boolean;
  // The own trips of a driver: with the status; the driver and the car are the same on every card (U6).
  readonly own?: boolean;
  readonly onOpen: () => void;
};

// One trip in a list, everything a person decides by: the day, the distance and the price,
// A and B with the times, the driver's comment, the driver and the car, the seats and the marks.
export function TripCard({ trip, showStatus = false, own = false, onOpen }: TripCardProps) {
  const { t, formatMoney, formatDate } = useI18n();
  const { driver } = trip;
  const wayFacts = useWayFacts();
  const facts: readonly Fact[] = [
    ['passengers', t('market.trip.seats', { count: String(trip.seatsLeft) })],
    ...(trip.woman ? [['profile', t('market.search.woman')] as const] : []),
    ...wayFacts(trip),
    ...(showStatus || own ? [[statusIcon(trip.status), t(`market.status.${trip.status}`)] as const] : []),
  ];
  return (
    <Section>
      <Tappable Component="div" className="trip-card" interactiveAnimation="background" onClick={onOpen}>
        <div className="trip-card-head">
          <span>
            <Text weight="2">{formatDate(new Date(trip.departAt))}</Text>
            <Caption className="trip-card-hint">{` · ${t('market.trip.km', { km: String(trip.km) })}`}</Caption>
          </span>
          <span className="trip-card-prices">
            <Text weight="1" className="trip-price">
              {formatMoney(trip.price)}
            </Text>
            {trip.recommendedPrice === null ? null : (
              <Caption className="trip-card-hint">
                {t('market.trip.recommendedShort', { price: formatMoney(trip.recommendedPrice) })}
              </Caption>
            )}
          </span>
        </div>
        <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
        {trip.comment ? <Caption className="trip-card-comment">{trip.comment}</Caption> : null}
        <FactChips facts={facts} />
        {own ? null : (
          <div className="trip-card-foot">
            <ProfilePhoto
              userId={driver.id}
              name={driver.firstName}
              hasAvatar={driver.hasAvatar}
              size={PHOTO_SIZE}
            />
            <span className="trip-card-driver">
              <Text>{driver.firstName}</Text>
              <RatingBadge rating={driver.rating} />
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
