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
