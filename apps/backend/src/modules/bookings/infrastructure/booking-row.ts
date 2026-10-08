import type { BookingMode, BookingStatus } from '@platform/contracts';
import type { BookingRecord, Named } from '../domain/booking';
import { MARK_COLUMNS, markValues, marksOf, type MarkRow } from './mark-row';
import { namedOf, pointOf } from './named-json';

// A row of the table bookings (migrations 0008, 0009, 0024, 0043, 0047, 0050, 0051) and back.
export type BookingRow = MarkRow & {
  id: string;
  trip_id: string;
  passenger_id: number;
  seats: number;
  whole_car: number;
  with_woman: number;
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
  note: string | null;
  offer_id: string | null;
  talk_id: string | null;
  confirmed_at: number | null;
  boarded_at: number | null;
  arrived_at: number | null;
  came_at: number | null;
  created_at: number;
  updated_at: number;
};

export const toBooking = (row: BookingRow): BookingRecord => ({
  id: row.id,
  tripId: row.trip_id,
  passengerId: row.passenger_id,
  seats: row.seats,
  wholeCar: row.whole_car === 1,
  withWoman: row.with_woman === 1,
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
  note: row.note,
  offerId: row.offer_id,
  talkId: row.talk_id,
  confirmedAt: row.confirmed_at,
  boardedAt: row.boarded_at,
  arrivedAt: row.arrived_at,
  cameAt: row.came_at,
  ...marksOf(row),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const json = (named: Named | null) => (named ? JSON.stringify(named) : null);

// The points, their names and the note: written together, erased together (docs/69).
export const pointValues = (b: BookingRecord) =>
  [
    b.pickup?.lat ?? null,
    b.pickup?.lng ?? null,
    json(b.pickupNamed),
    b.dropoff?.lat ?? null,
    b.dropoff?.lng ?? null,
    json(b.dropoffNamed),
    b.note,
  ] as const;
export const POINT_COLUMNS = [
  'pickup_lat',
  'pickup_lng',
  'pickup_name',
  'dropoff_lat',
  'dropoff_lng',
  'dropoff_name',
  'note',
] as const;

export const rowValues = (b: BookingRecord) =>
  [
    b.tripId,
    b.passengerId,
    b.seats,
    b.wholeCar ? 1 : 0,
    b.withWoman ? 1 : 0,
    b.price,
    b.commission,
    b.status,
    b.expiresAt,
    b.mode,
    b.pitakId,
    ...pointValues(b),
    b.offerId,
    b.talkId,
    b.confirmedAt,
    b.boardedAt,
    b.arrivedAt,
    b.cameAt,
    ...markValues(b),
    b.createdAt,
    b.updatedAt,
  ] as const;
export const ROW_COLUMNS = [
  'trip_id',
  'passenger_id',
  'seats',
  'whole_car',
  'with_woman',
  'price',
  'commission',
  'status',
  'expires_at',
  'pickup_mode',
  'pitak_id',
  ...POINT_COLUMNS,
  'offer_id',
  'talk_id',
  'confirmed_at',
  'boarded_at',
  'arrived_at',
  'came_at',
  ...MARK_COLUMNS,
  'created_at',
  'updated_at',
] as const;
