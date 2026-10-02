import type { Booking } from '@platform/contracts';
import { useAvatarUrl } from '../account/profile/use-avatar-url';
import { Avatar, AvatarStack, Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';

const SIZE = 28;

// Who rides, at a glance: the faces of the confirmed passengers and their seats (docs/88 L14).
export function PassengersStack({ bookings }: { readonly bookings: readonly Booking[] }) {
  const { t } = useI18n();
  const riding = bookings.filter((booking) => booking.status === 'confirmed');
  if (riding.length === 0) return null;
  const seats = riding.reduce((sum, booking) => sum + booking.seats, 0);
  return (
    <Section>
      <Cell
        before={
          // AvatarStack drops its className: the wrapper carries ours.
          <span className="passengers-stack-box">
            <AvatarStack>
              {riding.map((booking) => (
                <Face key={booking.id} booking={booking} />
              ))}
            </AvatarStack>
          </span>
        }
      >
        {t('market.request.seats', { count: String(seats) })}
      </Cell>
    </Section>
  );
}

function Face({ booking }: { readonly booking: Booking }) {
  const { id, firstName, hasAvatar } = booking.passenger;
  const url = useAvatarUrl(id, hasAvatar);
  return <Avatar size={SIZE} acronym={firstName.slice(0, 1)} {...(url ? { src: url } : {})} />;
}
