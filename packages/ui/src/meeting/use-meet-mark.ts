import type { Booking, DriverMeetStep } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFailure } from '../states/use-failure';
import { confirm, haptic } from '../telegram/feedback';

// A mark of the driver at the point (docs/126, G63): «Men keldim», «Keldi», «Kelmadi». «Kelmadi»
// is asked first: it sends the refund of the commission to the team. A failed mark says why.
export function useMeetMark(onChanged: (booking: Booking) => void) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { failure, fail, clear } = useFailure();
  const mark = async (booking: Booking, step: DriverMeetStep) => {
    const name = booking.passenger.firstName;
    const ask = t('driverAfter.noShow.ask', { name });
    if (step === 'no_show' && !(await confirm(ask, t('driverAfter.noShow.mark')))) return;
    clear();
    try {
      onChanged(await bookings.meet(booking.id, step));
      haptic.success();
    } catch (caught) {
      fail(caught);
    }
  };
  return { mark, failure };
}
