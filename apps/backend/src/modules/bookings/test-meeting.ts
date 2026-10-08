import type { MeetingPorts } from './application/meeting-ports';

// Test helper: the complaints and the live screens of the meeting, written to the notes (G63).
export const fakeMeeting = (notes: string[]): MeetingPorts => ({
  fileNoShow: async (driverId, bookingId) => void notes.push(`complaint no_show ${driverId} ${bookingId}`),
  refunds: async () => new Map(),
  refreshPassenger: async (passengerId) => void notes.push(`signal ${passengerId} passenger`),
});
