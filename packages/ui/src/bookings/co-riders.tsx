import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { useLoad } from '../market/use-list';
import './co-riders.css';

const FACE = 36;

// «Hamrohlaringiz»: the other passengers of the trip with their faces (docs/05, G46), never a phone.
// Nothing when the passenger rides alone.
export function CoRiders({ bookingId }: { readonly bookingId: string }) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { value } = useLoad(() => bookings.riders(bookingId));
  if (!value || value.length === 0) return null;
  return (
    <div className="booking-card co-riders">
      <p className="co-riders-title">{t('bookings.coRiders')}</p>
      {value.map((rider) => (
        <div key={rider.id} className="co-rider">
          <PersonBadge
            id={rider.id}
            name={rider.firstName}
            hasAvatar={rider.hasAvatar}
            size={FACE}
            role="passenger"
          />
          <span className="co-rider-name">{rider.firstName}</span>
        </div>
      ))}
    </div>
  );
}
