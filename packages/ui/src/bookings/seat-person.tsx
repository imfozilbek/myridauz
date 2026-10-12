import type { Booking } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { brandVars } from '../theme/brand-vars';
import { taken } from '../trip-end/trip-sums';
import { doneSteps } from './booking-steps';
import './seat-person.css';

const PHOTO_SIZE = 56;

// The passenger of a seat first (G78 sheet 3, d-seat): the face, the name, how many and where the
// seat is: its last step, amber while it is asked; a seat that is over says why in grey.
export function SeatPerson({ booking }: { readonly booking: Booking }) {
  const { t } = useI18n();
  // The screen of a booking has no colours of the app of its own: the state brings them.
  const { colors } = useBrand().theme;
  const { passenger, status } = booking;
  const last = doneSteps(booking).at(-1)?.label ?? 'chat.system.requested';
  const live = status === 'requested' || taken(booking);
  const tone = status === 'requested' ? 'asked' : live ? 'done' : 'over';
  return (
    <Section>
      <Cell
        className="seat-person"
        before={
          <PersonBadge
            id={passenger.id}
            name={passenger.firstName}
            hasAvatar={passenger.hasAvatar}
            size={PHOTO_SIZE}
            role="passenger"
          />
        }
        description={
          <span className="seat-seats">{t('market.request.seats', { count: String(booking.seats) })}</span>
        }
        after={
          <span className={`seat-state seat-state-${tone}`} style={brandVars(colors)}>
            {live ? t(last) : t(`bookings.status.${status}`)}
          </span>
        }
      >
        {passenger.firstName}
      </Cell>
    </Section>
  );
}
