import type { Booking, DriverMeetStep } from '@platform/contracts';
import { useRef } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFailure } from '../states/use-failure';
import { confirm, haptic } from '../telegram/feedback';

// A mark of the driver at the point (docs/126, G63): «Men keldim», «Keldi», «Kelmadi». «Kelmadi»
// is asked first: it sends the refund of the commission to the team. «Keldi» puts the passenger in
// the car (G76, docs/43). A failed mark says why.
// Each mark goes once (docs/65 A4): a second tap while it is asked or sent, or before the fresh list
// comes, sends nothing. After «Men keldim» only «Keldi» or «Kelmadi» may follow; they are final.
export function useMeetMark(onChanged: (booking: Booking) => void, screen = 'bookings.meeting') {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { track } = useAnalytics();
  const { failure, fail, clear } = useFailure();
  const sent = useRef(new Map<string, DriverMeetStep>());
  const mark = async (booking: Booking, step: DriverMeetStep) => {
    const before = sent.current.get(booking.id);
    if (before !== undefined && (before !== 'came' || step === 'came')) return;
    sent.current.set(booking.id, step);
    const undo = () => (before ? sent.current.set(booking.id, before) : sent.current.delete(booking.id));
    const name = booking.passenger.firstName;
    const ask = t('driverAfter.noShow.ask', { name });
    if (step === 'no_show' && !(await confirm(ask, t('complaints.reason.no_show')))) return void undo();
    clear();
    try {
      onChanged(await bookings.meet(booking.id, step));
      // «Keldi» is the passenger in the car: the step «boarded» of the funnel (G76, docs/29).
      if (step === 'met') track({ name: 'boarded', screen });
      haptic.success();
    } catch (caught) {
      undo();
      fail(caught);
    }
  };
  return { mark, failure };
}
