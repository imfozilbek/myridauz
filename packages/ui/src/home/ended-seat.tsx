import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { OutcomePlate } from '../states/outcome-plate';

type Props = { readonly booking: Booking; readonly onOpen: () => void };

// A seat that ended without a trip on the main screen (G75, docs/158 А): the plate of every end,
// a tap opens the booking with «Oʻxshash safarlar».
export function EndedSeat({ booking, onOpen }: Props) {
  const { t } = useI18n();
  const { status } = booking;
  if (status !== 'declined' && status !== 'expired' && status !== 'cancelled_by_driver') return null;
  return (
    <button type="button" className="home-note-button" onClick={onOpen}>
      <OutcomePlate
        tick={false}
        off
        title={t(`bookings.status.${status}`)}
        lines={[t(`bookings.why.${status}`)]}
      />
    </button>
  );
}
