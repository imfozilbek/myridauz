import type { DriverMeetStep, RefundState } from '@platform/contracts';

// The marks of the driver at the point are written in one guarded step (G63, docs/65 A4): false when
// the mark is set already, the other mark won, or the booking is not confirmed any more.
export type MarkStore = { markOnce(id: string, step: DriverMeetStep, now: number): Promise<boolean> };

// What the meeting at the point needs of other modules (docs/126, G63): set in deps.ts.
export type MeetingPorts = {
  // «Kelmadi» files one no_show complaint of the driver: the case goes to the team (docs/124 В).
  fileNoShow(driverId: number, bookingId: string): Promise<void>;
  // The refunds of no-shows on the driver's rides, by booking (docs/35).
  refunds(driverId: number, bookingIds: readonly string[]): Promise<ReadonlyMap<string, RefundState>>;
  // The open Mini App of the passenger refreshes (docs/64).
  refreshPassenger(passengerId: number): Promise<void>;
};
