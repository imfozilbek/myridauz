import type { Trip } from '@platform/contracts';
import { Caption, Tappable, Text } from '@telegram-apps/telegram-ui';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { RouteView } from './route-view';

const PHOTO_SIZE = 40;

type TripCardProps = { readonly trip: Trip; readonly showStatus?: boolean; readonly onOpen: () => void };

// One trip in a list: the day and the price, A and B with the times, the driver, the car and the seats.
export function TripCard({ trip, showStatus = false, onOpen }: TripCardProps) {
  const { t, formatMoney, formatDate } = useI18n();
  const { driver } = trip;
  const facts = [
    t('market.trip.seats', { count: String(trip.seats) }),
    ...(trip.woman ? [t('market.search.woman')] : []),
    ...(showStatus ? [t(`market.status.${trip.status}`)] : []),
  ];
  return (
    <Section>
      <Tappable Component="div" className="trip-card" interactiveAnimation="background" onClick={onOpen}>
        <div className="trip-card-head">
          <Text weight="2">{formatDate(new Date(trip.departAt))}</Text>
          <Text weight="1" className="trip-price">
            {formatMoney(trip.price)}
          </Text>
        </div>
        <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
        <div className="trip-card-foot">
          <ProfilePhoto
            userId={driver.id}
            name={driver.firstName}
            hasAvatar={driver.hasAvatar}
            size={PHOTO_SIZE}
          />
          <span className="trip-card-driver">
            <Text>{driver.firstName}</Text>
            <Caption className="trip-card-hint">
              {`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
            </Caption>
          </span>
          <Caption className="trip-card-hint trip-card-facts">{facts.join(' · ')}</Caption>
        </div>
      </Tappable>
    </Section>
  );
}
