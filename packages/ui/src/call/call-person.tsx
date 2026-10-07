import type { ChatAbout } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { PlateBadge } from '../find/plate-badge';

const PHOTO = 88;

// The other side of a chat: the driver with the car for a passenger, the passenger for a driver.
export function otherName({ booking, role }: ChatAbout): string | null {
  if (!booking) return null;
  return role === 'passenger' ? booking.trip.driver.firstName : booking.passenger.firstName;
}

// Who is on the call (mockup g60/4): the face in a ring, the name, the car and the plate. A driver
// knows the own car: the passenger is a face and a name.
export function CallPerson({ about, name }: { readonly about: ChatAbout | null; readonly name: string }) {
  const { t } = useI18n();
  const booking = about?.booking ?? null;
  const other = booking ? (about?.role === 'passenger' ? booking.trip.driver : booking.passenger) : null;
  const car = booking && about?.role === 'passenger' ? booking.trip.driver.car : null;
  return (
    <>
      <span className="call-ring">
        {other ? (
          <PersonBadge id={other.id} name={other.firstName} hasAvatar={other.hasAvatar} size={PHOTO} />
        ) : null}
      </span>
      <b className="call-name">{name}</b>
      {car ? (
        <span className="call-car">
          {`${car.model}, ${t(`drivers.color.${car.color}`)} · `}
          {booking?.plate ? <PlateBadge plate={booking.plate} /> : null}
        </span>
      ) : null}
    </>
  );
}
