import type { DriverMeetStep } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';

// The marks of the driver at the point (migrations/0047, G63) in a row of bookings and back.
export type MarkRow = {
  driver_came_at: number | null;
  met_at: number | null;
  no_show_at: number | null;
};

export const marksOf = (row: MarkRow) => ({
  driverCameAt: row.driver_came_at,
  metAt: row.met_at,
  noShowAt: row.no_show_at,
});

export const MARK_COLUMNS = ['driver_came_at', 'met_at', 'no_show_at'] as const;
export const markValues = (b: BookingRecord) => [b.driverCameAt, b.metAt, b.noShowAt] as const;

// The rules of domain/meeting.ts mark() in one statement (docs/65 A4): «Keldi» and «Kelmadi» once
// and never both, «Men keldim» once before them, «Kelmadi» never after the passenger got in.
// «Keldi» puts the passenger in the car (G76, docs/43).
const OPEN = 'met_at IS NULL AND no_show_at IS NULL';
const MARK = {
  came: { set: 'driver_came_at = ?1', guard: `driver_came_at IS NULL AND ${OPEN}` },
  met: { set: 'met_at = ?1, boarded_at = COALESCE(boarded_at, ?1)', guard: OPEN },
  no_show: { set: 'no_show_at = ?1', guard: `${OPEN} AND boarded_at IS NULL AND arrived_at IS NULL` },
} as const;
export const markOnceSql = (step: DriverMeetStep) =>
  `UPDATE bookings SET ${MARK[step].set}, updated_at = ?1
  WHERE id = ?2 AND status = 'confirmed' AND ${MARK[step].guard}`;
