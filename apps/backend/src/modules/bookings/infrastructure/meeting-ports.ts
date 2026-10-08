import type { Bindings } from '../../../env';
import { fileNoShowOf, noShowRefundsOf } from '../../complaints';
import { sendSignals } from '../../feed';
import type { MeetingPorts } from '../application/meeting-ports';

// «Kelmadi» goes to the complaints of the team; the screen of the passenger hears the change (G63).
export const meetingPorts = (env: Bindings): MeetingPorts => ({
  fileNoShow: (driverId, bookingId) => fileNoShowOf(env, driverId, bookingId),
  refunds: (driverId, bookingIds) => noShowRefundsOf(env, driverId, bookingIds),
  refreshPassenger: (passengerId) => sendSignals(env, [{ userId: passengerId, app: 'passenger' }]),
});
