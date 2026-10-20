import type { Bindings } from '../../../env';
import { fileNoShowOf, noShowRefundsOf } from '../../complaints';
import { sendSignals } from '../../feed';
import { closeBookingShare } from '../../shares';
import type { MeetingPorts } from '../application/meeting-ports';

// «Kelmadi» goes to the complaints of the team and closes the link of close people; the screen of the
// passenger hears the change (G63, G89 C7).
export const meetingPorts = (env: Bindings): MeetingPorts => ({
  fileNoShow: (driverId, bookingId) => fileNoShowOf(env, driverId, bookingId),
  refunds: (driverId, bookingIds) => noShowRefundsOf(env, driverId, bookingIds),
  refreshPassenger: (passengerId) => sendSignals(env, [{ userId: passengerId, app: 'passenger' }]),
  closeShare: (bookingId) => closeBookingShare(env, bookingId),
});
