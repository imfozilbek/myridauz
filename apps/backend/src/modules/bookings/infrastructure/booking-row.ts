import { placeNameSchema, type BookingMode, type BookingStatus, type Point } from '@platform/contracts';
import { z } from 'zod';
import type { BookingRecord, Named } from '../domain/booking';

// A row of the table bookings (migrations 0008, 0009, 0024) and back.
export type BookingRow = {
  id: string;
  trip_id: string;
  passenger_id: number;
  seats: number;
  price: number;
  commission: number;
  status: BookingStatus;
  expires_at: number;
  pickup_mode: BookingMode | null;
  pitak_id: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_name: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_name: string | null;
  offer_id: string | null;
  boarded_at: number | null;
  arrived_at: number | null;
  created_at: number;
  updated_at: number;
};

const namedSchema = z.object({ name: placeNameSchema.nullable(), area: placeNameSchema.nullable() });

const pointOf = (lat: number | null, lng: number | null): Point | null =>
  lat === null || lng === null ? null : { lat, lng };

// The names are JSON: a broken or an old value reads as no names, never as an error.
function namedOf(json: string | null): Named | null {
  if (json === null) return null;
  try {
    const parsed = namedSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const toBooking = (row: BookingRow): BookingRecord => ({
  id: row.id,
  tripId: row.trip_id,
  passengerId: row.passenger_id,
  seats: row.seats,
  price: row.price,
  commission: row.commission,
  status: row.status,
  expiresAt: row.expires_at,
  mode: row.pickup_mode,
  pitakId: row.pitak_id,
  pickup: pointOf(row.pickup_lat, row.pickup_lng),
  pickupNamed: namedOf(row.pickup_name),
  dropoff: pointOf(row.dropoff_lat, row.dropoff_lng),
  dropoffNamed: namedOf(row.dropoff_name),
  offerId: row.offer_id,
  boardedAt: row.boarded_at,
  arrivedAt: row.arrived_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const json = (named: Named | null) => (named ? JSON.stringify(named) : null);

// The points and their names: written together, erased together.
export const pointValues = (b: BookingRecord) =>
  [
    b.pickup?.lat ?? null,
    b.pickup?.lng ?? null,
    json(b.pickupNamed),
    b.dropoff?.lat ?? null,
    b.dropoff?.lng ?? null,
    json(b.dropoffNamed),
  ] as const;
export const POINT_COLUMNS = [
  'pickup_lat',
  'pickup_lng',
  'pickup_name',
  'dropoff_lat',
  'dropoff_lng',
  'dropoff_name',
] as const;

export const rowValues = (b: BookingRecord) =>
  [
    b.tripId,
    b.passengerId,
    b.seats,
    b.price,
    b.commission,
    b.status,
    b.expiresAt,
    b.mode,
    b.pitakId,
    ...pointValues(b),
    b.offerId,
    b.boardedAt,
    b.arrivedAt,
    b.createdAt,
    b.updatedAt,
  ] as const;
export const ROW_COLUMNS = [
  'trip_id',
  'passenger_id',
  'seats',
  'price',
  'commission',
  'status',
  'expires_at',
  'pickup_mode',
  'pitak_id',
  ...POINT_COLUMNS,
  'offer_id',
  'boarded_at',
  'arrived_at',
  'created_at',
  'updated_at',
] as const;
