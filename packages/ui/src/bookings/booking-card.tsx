import type { Booking } from '@platform/contracts';
import { Caption, Tappable, Text } from '@telegram-apps/telegram-ui';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { FactChips, type Fact } from '../market/fact-chips';
import { RouteView } from '../market/route-view';
import { bookingIcon } from './booking-status';
import '../market/market.css';

const PHOTO_SIZE = 40;
type Props = { readonly booking: Booking; readonly side: 'passenger' | 'driver'; readonly onOpen: () => void };

// One booking in a list: the day and the status, A and B, who is on the other side.
export function BookingCard({ booking, side, onOpen }: Props) {
  const { t, formatMoney, formatDate } = useI18n();
  const { trip } = booking;
  const other =
    side === 'passenger'
      ? { id: trip.driver.id, name: trip.driver.firstName, avatar: trip.driver.hasAvatar }
      : { id: booking.passenger.id, name: booking.passenger.firstName, avatar: booking.passenger.hasAvatar };
  const facts: readonly Fact[] = [
    [bookingIcon(booking.status), t(`bookings.status.${booking.status}`)],
    ['passengers', t('market.request.seats', { count: String(booking.seats) })],
  ];
  return (
    <Section>
      <Tappable Component="div" className="trip-card" interactiveAnimation="background" onClick={onOpen}>
        <div className="trip-card-head">
          <Text weight="2">{formatDate(new Date(trip.departAt))}</Text>
          <Text weight="1" className="trip-price">
            {formatMoney(booking.price * booking.seats)}
          </Text>
        </div>
        <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
        <FactChips facts={facts} />
        <div className="trip-card-foot">
          <ProfilePhoto userId={other.id} name={other.name} hasAvatar={other.avatar} size={PHOTO_SIZE} />
          <span className="trip-card-driver">
            <Text>{other.name}</Text>
            {side === 'passenger' ? (
              <Caption className="trip-card-hint">{`${trip.driver.car.make} ${trip.driver.car.model}`}</Caption>
            ) : null}
          </span>
        </div>
      </Tappable>
    </Section>
  );
}
